import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PUNISHMENTS } from '../data/punishments'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import { useLiveMatches } from '../hooks/useLiveMatches'
import { saveMatch } from '../store/matchStore'
import { searchProfiles } from '../services/betService'
import { createNotification } from '../services/notificationService'
import type { Match, Sport } from '../types'
import SportIcon from '../components/ui/SportIcon'
import TeamLogo from '../components/ui/TeamLogo'

type Step = 1 | 2 | 3 | 4

interface WizardState {
  selectedMatchId: string
  creatorPickId: string
  punishmentId: string
  punishmentReps: number
  sportFilter: Sport | 'all'
}

const INITIAL: WizardState = {
  selectedMatchId: '',
  creatorPickId: '',
  punishmentId: '',
  punishmentReps: 0,
  sportFilter: 'all',
}

// Static fallback with relative dates
const today = new Date()
today.setHours(0, 0, 0, 0)

export default function CreateBet() {
  const navigate = useNavigate()
  const { addBet } = useBets()
  const { profile } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<WizardState>(INITIAL)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const liveMatches = useLiveMatches()

  // Opponent search
  const [opponentQuery, setOpponentQuery] = useState('')
  const [opponentResults, setOpponentResults] = useState<{ id: string; username: string }[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<{ id: string; username: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [notifiedOpponent, setNotifiedOpponent] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!opponentQuery.trim() || selectedOpponent) {
      setOpponentResults([])
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      const results = await searchProfiles(opponentQuery, profile?.id ?? '')
      setOpponentResults(results)
      setSearching(false)
    }, 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [opponentQuery, profile?.id, selectedOpponent])

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  // Fallback static matches (relative dates, never stale)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const liveList = [...liveMatches.football, ...liveMatches.basketball].filter(
    (m) => m.status === 'live' || new Date(m.scheduledAt) >= todayStart,
  )

  const allMatches: Match[] = liveMatches.loading
    ? []
    : liveList.length > 0
      ? liveList
      : [] // empty means "use fallback" below — but we already handle this

  const filteredMatches =
    state.sportFilter === 'all'
      ? allMatches
      : allMatches.filter((m) => m.sport === state.sportFilter)

  const selectedMatch = allMatches.find((m) => m.id === state.selectedMatchId)
  const selectedPunishment = PUNISHMENTS.find((p) => p.id === state.punishmentId)

  function canNext(): boolean {
    if (step === 1) return !!profile
    if (step === 2) return state.selectedMatchId !== ''
    if (step === 3) return state.creatorPickId !== ''
    if (step === 4) return state.punishmentId !== '' && state.punishmentReps > 0
    return false
  }

  async function handleCreate() {
    if (!selectedMatch || !profile || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      if (selectedMatch) saveMatch(selectedMatch)

      const created = await addBet({
        matchId: state.selectedMatchId,
        creatorId: profile.id,
        creator: { name: profile.username, teamPickId: state.creatorPickId },
        opponent: { name: '' },
        punishment: { punishmentId: state.punishmentId, reps: state.punishmentReps },
        status: 'pending',
        opponentId: selectedOpponent?.id,
        sport: selectedMatch.sport,
        matchScheduledAt: selectedMatch.scheduledAt,
        homeTeamName: selectedMatch.homeTeam.name,
        awayTeamName: selectedMatch.awayTeam.name,
        homeTeamEmoji: selectedMatch.homeTeam.emoji,
        awayTeamEmoji: selectedMatch.awayTeam.emoji,
        homeTeamId: selectedMatch.homeTeam.id,
        awayTeamId: selectedMatch.awayTeam.id,
        homeTeamLogo: selectedMatch.homeTeam.logo,
        awayTeamLogo: selectedMatch.awayTeam.logo,
      })

      if (created.inviteToken) {
        const link = `${window.location.origin}/invite/${created.inviteToken}`
        setInviteLink(link)
        if (selectedOpponent) {
          createNotification(
            selectedOpponent.id,
            created.id,
            `${profile.username} challenged you to a bet! Click to accept.`,
            '',
            '',
          ).catch(console.error)
          setNotifiedOpponent(true)
        }
      } else {
        navigate(`/bets/${created.id}`)
      }
    } catch (err) {
      console.error('Failed to create bet:', err)
      setCreateError(err instanceof Error ? err.message : 'Failed to create bet. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function handleCopyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const STEPS = ['You', 'Match', 'Pick', 'Punishment']

  // ── Invite screen ────────────────────────────────────────────────────────────
  if (inviteLink) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-black text-white mb-2">Bet Created!</h2>
        {notifiedOpponent && selectedOpponent ? (
          <p className="text-slate-400 text-sm mb-2">
            <span className="text-violet-400 font-semibold">{selectedOpponent.username}</span> has been notified. Share this link as a backup, or send it to others too.
          </p>
        ) : (
          <p className="text-slate-400 text-sm mb-2">
            Share this link with your friends. Everyone who clicks it picks their team — losers do the punishment.
          </p>
        )}
        <p className="text-slate-500 text-xs mb-8">The link stays open until the match is resolved.</p>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-left">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Invite link</p>
          <p className="text-slate-200 text-sm break-all font-mono">{inviteLink}</p>
        </div>
        <button
          onClick={handleCopyLink}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors mb-3"
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-black text-white mb-6">New Bet</h1>

      {/* Progress */}
      <div className="flex items-start mb-8">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step
          const active = n === step
          const done = n < step
          const isLast = i === STEPS.length - 1
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
              {!isLast && (
                <div className={`absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-300 ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/10'
                      : 'bg-slate-800 border border-slate-600 text-slate-500'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={`text-xs font-medium transition-colors ${active ? 'text-emerald-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1: You + optional opponent */}
      {step === 1 && (
        <div className="space-y-5 animate-slide-up">
          <h2 className="text-lg font-bold text-white">Players</h2>

          {/* Creator */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">You</p>
            <div className="bg-slate-800 border border-emerald-500/40 rounded-xl px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{profile?.username}</p>
                <p className="text-xs text-slate-400">Betting as you</p>
              </div>
              <span className="ml-auto text-xs text-emerald-400 font-medium">You</span>
            </div>
          </div>

          {/* Opponent */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Opponent <span className="text-slate-600 normal-case">(optional)</span></p>

            {selectedOpponent ? (
              <div className="bg-slate-800 border border-violet-500/40 rounded-xl px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
                  {selectedOpponent.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{selectedOpponent.username}</p>
                  <p className="text-xs text-slate-400">Will be notified to accept</p>
                </div>
                <button
                  onClick={() => { setSelectedOpponent(null); setOpponentQuery('') }}
                  className="ml-auto text-xs text-slate-500 hover:text-white transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by username…"
                    value={opponentQuery}
                    onChange={(e) => setOpponentQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                  />
                  {searching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">…</span>
                  )}
                </div>

                {opponentResults.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {opponentResults.map((u, i) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedOpponent(u); setOpponentQuery(''); setOpponentResults([]) }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors ${i > 0 ? 'border-t border-slate-700' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-xs">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}

                {opponentQuery.trim() && !searching && opponentResults.length === 0 && (
                  <p className="text-xs text-slate-500 px-1">No users found for "{opponentQuery}"</p>
                )}

                <p className="text-xs text-slate-500 px-1">
                  Or skip this — you'll get a shareable invite link after creation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Match */}
      {step === 2 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Choose a match</h2>
            {liveMatches.loading && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Loading…
              </span>
            )}
            {!liveMatches.loading && !liveMatches.error && (
              <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Live
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            {(['all', 'football', 'basketball'] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ sportFilter: s })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  state.sportFilter === s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {s === 'football' && <SportIcon sport="football" size="sm" />}
                {s === 'basketball' && <SportIcon sport="basketball" size="sm" />}
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {liveMatches.loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 animate-pulse">
                  <div className="h-3 bg-slate-700 rounded w-16 mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-48 mb-1.5" />
                  <div className="h-3 bg-slate-700 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No matches found for today.</div>
              ) : (() => {
                const byKickoff  = (a: Match, b: Match) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                const liveNow    = filteredMatches.filter(m => m.status === 'live').sort(byKickoff)
                const upcoming   = filteredMatches.filter(m => m.status !== 'live').sort(byKickoff)
                const MatchCard = (match: typeof filteredMatches[0]) => (
                  <button
                    key={match.id}
                    onClick={() => update({ selectedMatchId: match.id, creatorPickId: '' })}
                    className={`w-full text-left bg-slate-800 border rounded-xl px-4 py-3 transition-all duration-150 ${
                      state.selectedMatchId === match.id
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <SportIcon sport={match.sport} size="sm" />
                        <span className="text-xs text-slate-500 uppercase tracking-wide">{match.sport}</span>
                      </div>
                      {match.status === 'live' ? (
                        <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                          {match.statusText ?? 'LIVE'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {new Date(match.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </div>
                  </button>
                )
                return (
                  <>
                    {liveNow.length > 0 && (
                      <>
                        <p className="text-[11px] text-red-400 font-semibold uppercase tracking-widest px-1 pt-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> Live now
                        </p>
                        {liveNow.map(MatchCard)}
                      </>
                    )}
                    {upcoming.length > 0 && (
                      <>
                        <p className={`text-[11px] text-slate-500 font-semibold uppercase tracking-widest px-1 ${liveNow.length > 0 ? 'pt-3' : 'pt-1'}`}>
                          Upcoming today
                        </p>
                        {upcoming.map(MatchCard)}
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Your pick */}
      {step === 3 && selectedMatch && (
        <div className="animate-slide-up space-y-5">
          <h2 className="text-lg font-bold text-white">Your pick</h2>
          <p className="text-slate-400 text-sm -mt-3">
            {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
          </p>
          <p className="text-xs text-slate-500">Your friends will pick their teams when they join via the invite link.</p>
          <div className="grid grid-cols-2 gap-3">
            {[selectedMatch.homeTeam, selectedMatch.awayTeam].map((team) => (
              <button
                key={team.id}
                onClick={() => update({ creatorPickId: team.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  state.creatorPickId === team.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                <TeamLogo name={team.name} logo={team.logo} teamId={team.id} sport={selectedMatch.sport} emoji={team.emoji} size="md" />
                <span className="font-semibold text-sm text-center">{team.name}</span>
                <span className="text-xs text-slate-500">{team.shortCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Punishment */}
      {step === 4 && (
        <div className="animate-slide-up space-y-4">
          <h2 className="text-lg font-bold text-white">Choose the punishment</h2>
          <p className="text-slate-400 text-sm -mt-2">Anyone who picks the losing team must complete this.</p>

          <div className="grid grid-cols-2 gap-2">
            {PUNISHMENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => update({ punishmentId: p.id, punishmentReps: state.punishmentReps || p.defaultReps })}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                  state.punishmentId === p.id
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="font-medium text-sm">{p.name}</span>
              </button>
            ))}
          </div>

          {state.punishmentId && selectedPunishment && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-slate-300 font-medium">
                  {selectedPunishment.isTimeBased ? 'Seconds' : 'Reps'}
                </label>
                <span className="text-2xl font-black text-amber-400">{state.punishmentReps}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={state.punishmentReps || selectedPunishment.defaultReps}
                onChange={(e) => update({ punishmentReps: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span>100</span>
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedMatch && state.punishmentId && selectedPunishment && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
              <div className="font-semibold text-slate-300 mb-3">Bet Summary</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Match</span>
                <span className="text-white font-medium">
                  {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Your pick</span>
                <span className="text-white">
                  {selectedMatch.homeTeam.id === state.creatorPickId
                    ? selectedMatch.homeTeam.name
                    : selectedMatch.awayTeam.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Punishment</span>
                <span className="text-amber-400 font-medium">
                  {state.punishmentReps} {selectedPunishment.name}
                  {selectedPunishment.isTimeBased ? ' secs' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Losers</span>
                <span className="text-slate-300 text-xs">Everyone who picks the losing team</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {createError && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {createError}
        </div>
      )}
      <div className="flex gap-3 mt-4">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canNext()}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!canNext() || creating}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {creating ? 'Creating…' : '🏆 Create & Get Link'}
          </button>
        )}
      </div>
    </div>
  )
}
