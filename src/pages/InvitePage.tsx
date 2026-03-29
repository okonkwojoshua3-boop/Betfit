import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { fetchBetByToken, acceptInvite } from '../services/betService'
import { getPunishmentById } from '../data/punishments'
import SportIcon from '../components/ui/SportIcon'
import TeamLogo from '../components/ui/TeamLogo'
import type { Bet } from '../types'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { user, profile, signInWithGoogle, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [bet, setBet] = useState<Bet | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamPickId, setTeamPickId] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!user || !token) return
    setFetching(true)
    fetchBetByToken(token)
      .then((b) => {
        if (!b) setError('This invite link is invalid or has expired.')
        else setBet(b)
      })
      .catch(() => setError('Failed to load invite.'))
      .finally(() => setFetching(false))
  }, [user, token])

  // For 1v1 bets: auto-select the opposite team once bet is loaded
  useEffect(() => {
    if (!bet?.opponentId) return
    const homeId = bet.homeTeamId ?? 'home'
    const awayId = bet.awayTeamId ?? 'away'
    const creatorPickedHome = bet.creator.teamPickId === homeId
    setTeamPickId(creatorPickedHome ? awayId : homeId)
  }, [bet])

  function handleSignIn() {
    sessionStorage.setItem('post_auth_redirect', window.location.pathname)
    signInWithGoogle()
  }

  async function handleAccept() {
    if (!bet || !profile || !teamPickId || !token) return
    setAccepting(true)
    try {
      await acceptInvite(token, profile.id, profile.username, teamPickId)
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join the bet.'
      setError(msg)
      setAccepting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  // ── Not signed in ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-2xl font-black text-white mb-2">You've been challenged!</h1>
          <p className="text-slate-400 text-sm mb-8">
            Sign in with Google to see the bet details and pick your team.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading invite…</p>
      </div>
    )
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">Oops</h2>
          <p className="text-slate-400 text-sm mb-6">{error ?? 'This link is invalid or has expired.'}</p>
          <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Bet already resolved ─────────────────────────────────────────────────────
  if (bet.status === 'punishment_pending' || bet.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🏁</div>
          <h2 className="text-xl font-bold text-white mb-2">Bet already resolved</h2>
          <p className="text-slate-400 text-sm mb-6">This match has finished and the results are in.</p>
          <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Current user is the creator ──────────────────────────────────────────────
  if (bet.creatorId === profile?.id) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-white mb-2">This is your bet</h2>
          <p className="text-slate-400 text-sm mb-6">Share this link with your friends so they can join and pick their team.</p>
          <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Already joined ───────────────────────────────────────────────────────────
  const alreadyJoined = bet.participants?.some((p) => p.userId === profile?.id)
  if (alreadyJoined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">You're in!</h2>
          <p className="text-slate-400 text-sm mb-6">You've already joined this bet. Check the dashboard for updates.</p>
          <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Private 1v1: non-invited user ───────────────────────────────────────────
  if (bet.opponentId && bet.opponentId !== profile?.id) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Private bet</h2>
          <p className="text-slate-400 text-sm mb-6">
            {bet.creator.name} sent this bet to a specific opponent. This link isn't for you.
          </p>
          <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300 text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Join form ────────────────────────────────────────────────────────────────
  const punishment = getPunishmentById(bet.punishment.punishmentId)

  const homeTeam = {
    name: bet.homeTeamName ?? 'Home',
    emoji: bet.homeTeamEmoji ?? '⚽',
    logo: bet.homeTeamLogo,
    id: bet.homeTeamId ?? 'home',
  }
  const awayTeam = {
    name: bet.awayTeamName ?? 'Away',
    emoji: bet.awayTeamEmoji ?? '⚽',
    logo: bet.awayTeamLogo,
    id: bet.awayTeamId ?? 'away',
  }

  const is1v1 = !!bet.opponentId
  const creatorPickedHomeTeam = bet.creator.teamPickId === homeTeam.id
  const participantCount = bet.participants?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-white mb-1">
          <span className="text-emerald-400">{bet.creator.name}</span>{' '}
          {is1v1 ? 'challenged you!' : 'invited you to a bet!'}
        </h1>
        <p className="text-slate-400 text-sm">
          {is1v1
            ? `They picked ${creatorPickedHomeTeam ? homeTeam.name : awayTeam.name} — you're on ${creatorPickedHomeTeam ? awayTeam.name : homeTeam.name}.`
            : 'Pick your team. Losers do the punishment.'}
        </p>
      </div>

      {/* Match card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SportIcon sport={bet.sport ?? 'football'} />
            <span className="text-slate-400 text-sm capitalize">{bet.sport ?? 'football'}</span>
          </div>
          {bet.matchScheduledAt && (
            <span className="text-xs text-slate-500">
              {new Date(bet.matchScheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
              {new Date(bet.matchScheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Teams VS */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center flex-1">
            <TeamLogo name={homeTeam.name} logo={homeTeam.logo} teamId={homeTeam.id} sport={bet.sport} emoji={homeTeam.emoji} size="xl" className="mb-2" />
            <div className="font-bold text-white">{homeTeam.name}</div>
            {creatorPickedHomeTeam && (
              <div className="text-xs text-emerald-400 mt-1">{bet.creator.name}'s pick</div>
            )}
          </div>
          <div className="text-slate-500 font-bold text-lg px-2">VS</div>
          <div className="text-center flex-1">
            <TeamLogo name={awayTeam.name} logo={awayTeam.logo} teamId={awayTeam.id} sport={bet.sport} emoji={awayTeam.emoji} size="xl" className="mb-2" />
            <div className="font-bold text-white">{awayTeam.name}</div>
            {!creatorPickedHomeTeam && (
              <div className="text-xs text-emerald-400 mt-1">{bet.creator.name}'s pick</div>
            )}
          </div>
        </div>

        {!is1v1 && participantCount > 0 && bet.participants && (
          <p className="text-xs text-slate-500 text-center mt-4">
            Already in: {bet.participants.map((p) => p.username).join(', ')}
          </p>
        )}
      </div>

      {/* Punishment */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">{punishment?.emoji ?? '💪'}</span>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Loser's punishment</div>
          <div className="text-amber-400 font-bold text-lg">
            {bet.punishment.reps} {punishment?.name ?? 'reps'}
            {punishment?.isTimeBased ? ' secs' : ''}
          </div>
        </div>
      </div>

      {/* Team pick */}
      {is1v1 ? (
        <>
          <p className="text-sm text-slate-400 mb-3 font-medium">Your team</p>
          <div
            className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-emerald-500 bg-emerald-500/10 mb-6"
          >
            <TeamLogo name={creatorPickedHomeTeam ? awayTeam.name : homeTeam.name} logo={creatorPickedHomeTeam ? awayTeam.logo : homeTeam.logo} teamId={creatorPickedHomeTeam ? awayTeam.id : homeTeam.id} sport={bet.sport} emoji={creatorPickedHomeTeam ? awayTeam.emoji : homeTeam.emoji} size="lg" />
            <span className="font-bold text-white text-lg">{creatorPickedHomeTeam ? awayTeam.name : homeTeam.name}</span>
            <span className="text-xs text-emerald-400">Your side — assigned automatically</span>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-3 font-medium">Pick your team</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[homeTeam, awayTeam].map((team) => (
              <button
                key={team.id}
                onClick={() => setTeamPickId(team.id)}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
                  teamPickId === team.id
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                }`}
              >
                <TeamLogo name={team.name} logo={team.logo} teamId={team.id} sport={bet.sport} emoji={team.emoji} size="lg" />
                <span className="font-semibold text-sm text-center text-white">{team.name}</span>
                {teamPickId === team.id && <span className="text-xs text-emerald-400">Selected ✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={handleAccept}
        disabled={!teamPickId || accepting}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-emerald-500/30 hover:shadow-md mb-3 text-base"
      >
        {accepting ? 'Joining…' : '🤝 Accept Bet'}
      </button>
      <button
        onClick={() => navigate('/dashboard')}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-medium py-3 rounded-xl transition-colors text-sm"
      >
        Back
      </button>
    </div>
  )
}
