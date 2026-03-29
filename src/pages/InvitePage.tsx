import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { fetchBetByToken, acceptInvite } from '../services/betService'
import { getPunishmentById } from '../data/punishments'
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

  // Use real ESPN team IDs (stored since team_ids_migration), fall back to 'home'/'away' for old bets
  const homeTeam = {
    name: bet.homeTeamName ?? 'Home',
    emoji: bet.homeTeamEmoji ?? '🏠',
    id: bet.homeTeamId ?? 'home',
  }
  const awayTeam = {
    name: bet.awayTeamName ?? 'Away',
    emoji: bet.awayTeamEmoji ?? '✈️',
    id: bet.awayTeamId ?? 'away',
  }

  // 1v1: opponent must pick the opposite team from the creator
  const is1v1 = !!bet.opponentId
  const creatorPickedHomeTeam = bet.creator.teamPickId === homeTeam.id
  const availableTeams = is1v1
    ? [creatorPickedHomeTeam ? awayTeam : homeTeam]
    : [homeTeam, awayTeam]

  const participantCount = bet.participants?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="text-2xl font-black text-white mb-1">
            <span className="text-emerald-400">{bet.creator.name}</span>{' '}
            {is1v1 ? 'challenged you!' : 'started a bet!'}
          </h1>
          <p className="text-slate-400 text-sm">
            {is1v1
              ? `They picked ${creatorPickedHomeTeam ? homeTeam.name : awayTeam.name}. You're on ${creatorPickedHomeTeam ? awayTeam.name : homeTeam.name}.`
              : 'Pick your team. Losers do the punishment.'}
          </p>
          {!is1v1 && participantCount > 0 && (
            <p className="text-slate-500 text-xs mt-1">{participantCount} {participantCount === 1 ? 'person' : 'people'} already in</p>
          )}
        </div>

        {/* Bet summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Match</span>
            <span className="text-white font-medium">{homeTeam.emoji} {homeTeam.name} vs {awayTeam.emoji} {awayTeam.name}</span>
          </div>
          {is1v1 ? (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{bet.creator.name}'s pick</span>
              <span className="text-slate-300">
                {creatorPickedHomeTeam ? `${homeTeam.emoji} ${homeTeam.name}` : `${awayTeam.emoji} ${awayTeam.name}`}
              </span>
            </div>
          ) : (
            participantCount > 0 && bet.participants && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">In the bet</span>
                <span className="text-slate-300 text-xs">{bet.participants.map((p) => p.username).join(', ')}</span>
              </div>
            )
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Punishment</span>
            <span className="text-amber-400 font-medium">
              {bet.punishment.reps} {punishment?.name ?? 'reps'}
              {punishment?.isTimeBased ? ' secs' : ''}
            </span>
          </div>
        </div>

        {/* Team pick */}
        <p className="text-sm text-slate-400 mb-3 font-medium">
          {is1v1 ? 'Your team' : 'Pick your team'}
        </p>
        <div className={`grid gap-3 mb-6 ${availableTeams.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {availableTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setTeamPickId(team.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                is1v1
                  ? 'border-violet-500 bg-violet-500/10 text-white cursor-default'
                  : teamPickId === team.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
              }`}
            >
              <span className="text-3xl">{team.emoji}</span>
              <span className="font-semibold text-sm text-center">{team.name}</span>
              {is1v1 && <span className="text-xs text-violet-400">Your side</span>}
            </button>
          ))}
        </div>

        <button
          onClick={handleAccept}
          disabled={!teamPickId || accepting}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors mb-3"
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
    </div>
  )
}
