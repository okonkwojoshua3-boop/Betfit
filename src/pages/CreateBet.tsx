import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { PUNISHMENTS } from '../data/punishments'
import { useBets } from '../store/BetContext'
import { usePlayers } from '../store/PlayerContext'
import { useAuth } from '../store/AuthContext'
import { useLiveMatches } from '../hooks/useLiveMatches'
import { saveMatch } from '../store/matchStore'
import type { Match, Sport } from '../types'
import type { Profile } from '../store/AuthContext'
import SportIcon from '../components/ui/SportIcon'

type Step = 1 | 2 | 3 | 4

interface WizardState {
  creatorName: string
  opponentName: string
  selectedMatchId: string
  creatorPickId: string
  opponentPickId: string
  punishmentId: string
  punishmentReps: number
  sportFilter: Sport | 'all'
}

const INITIAL: WizardState = {
  creatorName: '',
  opponentName: '',
  selectedMatchId: '',
  creatorPickId: '',
  opponentPickId: '',
  punishmentId: '',
  punishmentReps: 0,
  sportFilter: 'all',
}

export default function CreateBet() {
  const navigate = useNavigate()
  const { addBet } = useBets()
  const { players, searchUsers } = usePlayers()
  const { profile } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<WizardState>(() => ({
    ...INITIAL,
    // Auto-fill creator from current user
    creatorName: profile?.username ?? '',
  }))
  const [opponentQuery, setOpponentQuery] = useState('')
  const [opponentResults, setOpponentResults] = useState<Profile[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<Profile | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const liveMatches = useLiveMatches()

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  // Combine live + static, live matches take priority for today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const fallbackMatches = MATCHES.filter(
    (m) => m.status === 'live' || new Date(m.scheduledAt) >= todayStart,
  )
  const liveList = [...liveMatches.football, ...liveMatches.basketball]
  const allMatches: Match[] = liveMatches.loading || liveMatches.error || liveList.length === 0
    ? fallbackMatches
    : liveList

  const selectedMatch: Match | undefined = allMatches.find((m) => m.id === state.selectedMatchId)
  const selectedPunishment = PUNISHMENTS.find((p) => p.id === state.punishmentId)

  const filteredMatches =
    state.sportFilter === 'all'
      ? allMatches
      : allMatches.filter((m) => m.sport === state.sportFilter)

  function canNext(): boolean {
    if (step === 1) return !!profile
    if (step === 2) return state.selectedMatchId !== ''
    if (step === 3) {
      if (selectedOpponent) return state.creatorPickId !== '' && state.opponentPickId !== ''
      return state.creatorPickId !== ''
    }
    if (step === 4) return state.punishmentId !== '' && state.punishmentReps > 0
    return false
  }

  async function handleOpponentSearch(query: string) {
    setOpponentQuery(query)
    if (query.trim().length < 2) {
      setOpponentResults(players.filter((p) => p.id !== profile?.id))
      return
    }
    const results = await searchUsers(query)
    setOpponentResults(results.filter((p) => p.id !== profile?.id))
  }

  function handleSelectOpponent(p: Profile) {
    setSelectedOpponent(p)
    update({ opponentName: p.username })
    setOpponentQuery(p.username)
    setOpponentResults([])
  }

  async function handleCreate() {
    if (selectedMatch) saveMatch(selectedMatch)
    const created = await addBet({
      matchId: state.selectedMatchId,
      creatorId: profile?.id,
      opponentId: selectedOpponent?.id,
      creator: { name: state.creatorName.trim(), teamPickId: state.creatorPickId },
      opponent: { name: state.opponentName.trim(), teamPickId: state.opponentPickId || undefined },
      punishment: { punishmentId: state.punishmentId, reps: state.punishmentReps },
      status: 'pending',
      homeTeamName: selectedMatch?.homeTeam.name,
      awayTeamName: selectedMatch?.awayTeam.name,
      homeTeamEmoji: selectedMatch?.homeTeam.emoji,
      awayTeamEmoji: selectedMatch?.awayTeam.emoji,
    })
    if (!selectedOpponent && created.inviteToken) {
      setInviteLink(`${window.location.origin}/invite/${created.inviteToken}`)
    } else {
      navigate('/dashboard')
    }
  }

  function handleCopyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const STEPS = ['Players', 'Match', 'Picks', 'Punishment']

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Share screen — shown after creating a link-invite bet */}
      {inviteLink && (
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-black text-white mb-2">Bet Created!</h2>
          <p className="text-slate-400 text-sm mb-8">
            Share this link with your friend. They'll sign in and pick their team to accept the challenge.
          </p>
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
      )}

      {!inviteLink && (
        <>
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
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
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

      {/* Step 1: Players */}
      {step === 1 && (
        <div className="space-y-5 animate-slide-up">
          <h2 className="text-lg font-bold text-white">Who's betting?</h2>

          {/* Creator — locked to current user */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">You</label>
            <div className="bg-slate-800 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {profile?.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-white font-semibold">{profile?.username}</span>
              <span className="ml-auto text-xs text-emerald-400">You</span>
            </div>
          </div>

          {/* Opponent — search by username (optional) */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Opponent
              <span className="ml-2 text-slate-600 font-normal">optional — or share a link after</span>
            </label>
            <input
              type="text"
              value={opponentQuery}
              onChange={(e) => handleOpponentSearch(e.target.value)}
              placeholder="Search by username…"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />

            {/* Search results */}
            {opponentResults.length > 0 && !selectedOpponent && (
              <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {opponentResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectOpponent(p)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                      {p.username[0].toUpperCase()}
                    </div>
                    <span className="text-white text-sm">{p.username}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Show all users on focus with no query */}
            {opponentQuery === '' && opponentResults.length === 0 && players.filter(p => p.id !== profile?.id).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {players.filter(p => p.id !== profile?.id).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectOpponent(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedOpponent?.id === p.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {selectedOpponent?.id === p.id && '✓ '}{p.username}
                  </button>
                ))}
              </div>
            )}

            {selectedOpponent && (
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs text-emerald-400 flex-1">
                  ✓ Playing against <span className="font-semibold">{selectedOpponent.username}</span>
                </p>
                <button
                  onClick={() => {
                    setSelectedOpponent(null)
                    setOpponentQuery('')
                    update({ opponentName: '' })
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Change
                </button>
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
                Loading today's matches…
              </span>
            )}
            {liveMatches.error && (
              <span className="text-xs text-slate-500">Using preset matches</span>
            )}
            {!liveMatches.loading && !liveMatches.error && (
              <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Live
              </span>
            )}
          </div>

          {/* Sport tabs */}
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

          {/* Loading skeleton */}
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
                <div className="text-center py-10 text-slate-500 text-sm">
                  No matches found for today.
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() =>
                      update({ selectedMatchId: match.id, creatorPickId: '', opponentPickId: '' })
                    }
                    className={`w-full text-left bg-slate-800 border rounded-xl px-4 py-3 transition-all duration-150 ${
                      state.selectedMatchId === match.id
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <SportIcon sport={match.sport} size="sm" />
                        <span className="text-xs text-slate-500 uppercase tracking-wide">
                          {match.sport}
                        </span>
                      </div>
                      {match.status === 'live' && (
                        <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {match.status === 'finished' && match.result && (
                        <span className="text-xs font-bold text-slate-300 tabular-nums">
                          {match.result.homeScore}–{match.result.awayScore}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(match.scheduledAt).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Team picks */}
      {step === 3 && selectedMatch && (
        <div className="animate-slide-up space-y-5">
          <h2 className="text-lg font-bold text-white">Who wins?</h2>
          <p className="text-slate-400 text-sm -mt-3">
            {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
          </p>

          {[
            { label: state.creatorName, key: 'creatorPickId' as const },
            ...(selectedOpponent ? [{ label: state.opponentName, key: 'opponentPickId' as const }] : []),
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-sm text-slate-400 mb-2 block">{label} picks...</label>
              <div className="grid grid-cols-2 gap-2">
                {[selectedMatch.homeTeam, selectedMatch.awayTeam].map((team) => (
                  <button
                    key={team.id}
                    onClick={() => update({ [key]: team.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      state[key] === team.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-3xl">{team.emoji}</span>
                    <span className="font-semibold text-sm text-center">{team.name}</span>
                    <span className="text-xs text-slate-500">{team.shortCode}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Punishment */}
      {step === 4 && (
        <div className="animate-slide-up space-y-4">
          <h2 className="text-lg font-bold text-white">Choose the punishment</h2>
          <p className="text-slate-400 text-sm -mt-2">The loser must complete this exercise.</p>

          <div className="grid grid-cols-2 gap-2">
            {PUNISHMENTS.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  update({ punishmentId: p.id, punishmentReps: state.punishmentReps || p.defaultReps })
                }
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
                <span className="text-slate-500">{state.creatorName}</span>
                <span className="text-white">
                  {selectedMatch.homeTeam.id === state.creatorPickId
                    ? selectedMatch.homeTeam.name
                    : selectedMatch.awayTeam.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{state.opponentName}</span>
                <span className="text-white">
                  {selectedMatch.homeTeam.id === state.opponentPickId
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
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
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
            disabled={!canNext()}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            🏆 Lock In Bet
          </button>
        )}
      </div>
        </>
      )}
    </div>
  )
}
