import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import BetCard from '../components/bets/BetCard'
import { getMatchById } from '../data/matches'
import { getPunishmentById } from '../data/punishments'
import SportIcon from '../components/ui/SportIcon'

export default function Dashboard() {
  const navigate = useNavigate()
  const { getActiveBets, getPendingBets, declineBet, bets } = useBets()
  const { profile } = useAuth()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeBets = getActiveBets()
  const pendingBets = getPendingBets()
  // Pending bets the current user created — waiting for friends to join
  const myPendingBets = pendingBets.filter((b) => b.creatorId === profile?.id)
  // Pending bets the user was invited to / has joined — but didn't create
  const receivedPendingBets = pendingBets.filter((b) => b.creatorId !== profile?.id)
  const dueCount = activeBets.filter((b) => b.status === 'punishment_pending').length
  const totalCompleted = bets.filter((b) => b.status === 'completed').length

  function handleCopyLink(betId: string, token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
    setCopiedId(betId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">
          Bet <span className="text-emerald-400">&</span> Sweat
        </h1>
        <p className="text-slate-400">Bet on the match. Losers do the reps.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-800 border border-slate-700 border-t-2 border-t-emerald-500 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{activeBets.length}</div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Active</div>
        </div>
        <div className={`bg-slate-800 border border-t-2 rounded-xl p-4 text-center transition-colors ${dueCount > 0 ? 'border-red-500/40 border-t-red-500 shadow-sm shadow-red-500/10' : 'border-slate-700 border-t-slate-600'}`}>
          <div className={`text-3xl font-black transition-colors ${dueCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {dueCount}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Due</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 border-t-2 border-t-slate-600 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{totalCompleted}</div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Done</div>
        </div>
      </div>

      {/* Pending bets — waiting for friends to join */}
      {myPendingBets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            Waiting for Players
            <span className="bg-slate-600 text-slate-300 text-xs font-bold rounded-full w-5 h-5 inline-flex items-center justify-center">
              {myPendingBets.length}
            </span>
          </h2>
          <div className="space-y-3">
            {myPendingBets.map((bet) => {
              const match = getMatchById(bet.matchId)
              const punishment = getPunishmentById(bet.punishment.punishmentId)
              if (!match || !punishment) return null
              const participantCount = bet.participants?.length ?? 0
              return (
                <div key={bet.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SportIcon sport={match.sport} size="sm" />
                        <span className="text-white font-semibold text-sm">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        <span className="text-amber-400">{bet.punishment.reps} {punishment.name}</span>
                        {' · '}
                        {participantCount} {participantCount === 1 ? 'player' : 'players'} in
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold bg-slate-700/60 border border-slate-600 px-2 py-1 rounded-lg shrink-0">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {bet.inviteToken && (
                      <button
                        onClick={() => handleCopyLink(bet.id, bet.inviteToken!)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                      >
                        {copiedId === bet.id ? '✓ Copied!' : '🔗 Copy Invite Link'}
                      </button>
                    )}
                    <button
                      onClick={() => declineBet(bet.id)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm font-semibold px-3 py-2 rounded-lg transition-colors border border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Received invites / joined-but-pending */}
      {receivedPendingBets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            Invited to Bet
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 inline-flex items-center justify-center shadow-sm shadow-red-500/30">
              {receivedPendingBets.length}
            </span>
          </h2>
          <div className="space-y-3">
            {receivedPendingBets.map((bet) => {
              const match = getMatchById(bet.matchId)
              const punishment = getPunishmentById(bet.punishment.punishmentId)
              const homeTeamName = bet.homeTeamName ?? match?.homeTeam.name ?? 'Home'
              const awayTeamName = bet.awayTeamName ?? match?.awayTeam.name ?? 'Away'
              const homeTeamEmoji = bet.homeTeamEmoji ?? match?.homeTeam.emoji ?? '⚽'
              const awayTeamEmoji = bet.awayTeamEmoji ?? match?.awayTeam.emoji ?? '⚽'
              const alreadyJoined = bet.participants?.some((p) => p.userId === profile?.id)
              return (
                <div key={bet.id} className="bg-slate-800 border border-amber-500/30 border-t-2 border-t-amber-500 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SportIcon sport={match?.sport ?? 'football'} size="sm" />
                        <span className="text-white font-semibold text-sm">
                          {homeTeamEmoji} {homeTeamName} vs {awayTeamEmoji} {awayTeamName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        from <span className="text-white font-medium">{bet.creator.name}</span>
                        {punishment && (
                          <> · <span className="text-amber-400">{bet.punishment.reps} {punishment.name}</span></>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${
                      alreadyJoined
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}>
                      {alreadyJoined ? 'Joined' : 'Invited'}
                    </span>
                  </div>
                  {!alreadyJoined && bet.inviteToken && (
                    <button
                      onClick={() => navigate(`/invite/${bet.inviteToken}`)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold py-2 rounded-lg transition-colors"
                    >
                      View & Accept Bet
                    </button>
                  )}
                  {alreadyJoined && (
                    <button
                      onClick={() => navigate(`/bets/${bet.id}`)}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors border border-slate-600"
                    >
                      View Bet
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active bets */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Active Bets</h2>
        <button
          onClick={() => navigate('/create')}
          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
        >
          + New
        </button>
      </div>

      {activeBets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-700 hover:border-slate-600 rounded-2xl transition-colors bg-slate-900/30">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-white mb-2">No active bets yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Create a bet, share the link with your crew.<br />Everyone picks a team — losers do the reps!
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-emerald-500/30 hover:shadow-md"
          >
            Create First Bet
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeBets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  )
}
