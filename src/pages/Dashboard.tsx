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
  const myPendingBets = pendingBets.filter((b) => b.creatorId === profile?.id)
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
      <div className="mb-8 animate-fade-up animate-fill-both">
        <h1 className="font-display text-4xl font-bold text-white mb-1 tracking-tight">
          Bet <span className="gradient-text">&amp;</span> Sweat
        </h1>
        <p className="text-slate-500 text-sm">
          {profile ? `Welcome back, ${profile.username}.` : 'Bet on the match.'}{' '}
          Losers do the reps.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: activeBets.length, label: 'Active', accent: 'green' },
          { value: dueCount, label: 'Due', accent: dueCount > 0 ? 'red' : 'dim' },
          { value: totalCompleted, label: 'Done', accent: 'dim' },
        ].map(({ value, label, accent }, i) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl p-4 text-center animate-fade-up animate-fill-both`}
            style={{
              animationDelay: `${i * 60}ms`,
              background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
              border: accent === 'green'
                ? '1px solid rgba(34,214,114,0.2)'
                : accent === 'red'
                  ? '1px solid rgba(239,68,68,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
              boxShadow: accent === 'green'
                ? '0 0 24px rgba(34,214,114,0.06)'
                : accent === 'red'
                  ? '0 0 24px rgba(239,68,68,0.08)'
                  : 'none',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: accent === 'green'
                  ? 'linear-gradient(90deg, transparent, rgba(34,214,114,0.5), transparent)'
                  : accent === 'red'
                    ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              }}
            />
            <div className={`font-score text-4xl leading-none mb-1 ${
              accent === 'green' ? 'text-neon-green' : accent === 'red' ? 'text-red-400' : 'text-slate-300'
            }`}>
              {value}
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Waiting for players */}
      {myPendingBets.length > 0 && (
        <div className="mb-8 animate-fade-up animate-fill-both animate-delay-200">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-bold text-white text-lg">Waiting for Players</h2>
            <span className="text-[11px] font-bold bg-white/8 text-slate-400 border border-white/10 rounded-full w-5 h-5 inline-flex items-center justify-center">
              {myPendingBets.length}
            </span>
          </div>
          <div className="space-y-3">
            {myPendingBets.map((bet) => {
              const match = getMatchById(bet.matchId)
              const punishment = getPunishmentById(bet.punishment.punishmentId)
              const homeTeamName = match?.homeTeam.name ?? bet.homeTeamName ?? 'Home'
              const awayTeamName = match?.awayTeam.name ?? bet.awayTeamName ?? 'Away'
              if (!punishment) return null
              const participantCount = bet.participants?.length ?? 0
              return (
                <div
                  key={bet.id}
                  className="rounded-2xl p-4 transition-all duration-200 hover:border-white/10"
                  style={{
                    background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SportIcon sport={match?.sport ?? bet.sport ?? 'football'} size="sm" />
                        <span className="text-white font-semibold text-sm">
                          {homeTeamName} vs {awayTeamName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        <span className="text-amber-400/80">{bet.punishment.reps} {punishment.name}</span>
                        {' · '}
                        <span>{participantCount} {participantCount === 1 ? 'player' : 'players'} in</span>
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold bg-white/5 border border-white/8 px-2 py-1 rounded-lg shrink-0">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {bet.inviteToken && (
                      <button
                        onClick={() => handleCopyLink(bet.id, bet.inviteToken!)}
                        className="flex-1 text-pitch-950 text-sm font-semibold py-2 rounded-xl transition-all duration-200 active:scale-[0.98]"
                        style={{ background: copiedId === bet.id ? 'linear-gradient(135deg,#16A350,#0D7A3A)' : 'linear-gradient(135deg,#22D672,#16A350)', boxShadow: '0 2px 12px rgba(34,214,114,0.2)' }}
                      >
                        {copiedId === bet.id ? '✓ Copied!' : '🔗 Copy Invite Link'}
                      </button>
                    )}
                    <button
                      onClick={() => declineBet(bet.id)}
                      className="bg-white/5 hover:bg-white/8 text-slate-400 text-sm font-semibold px-3 py-2 rounded-xl transition-colors border border-white/8"
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

      {/* Received invites */}
      {receivedPendingBets.length > 0 && (
        <div className="mb-8 animate-fade-up animate-fill-both animate-delay-300">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-bold text-white text-lg">Invited to Bet</h2>
            <span className="text-[11px] font-bold bg-red-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.4)' }}>
              {receivedPendingBets.length}
            </span>
          </div>
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
                <div
                  key={bet.id}
                  className="relative overflow-hidden rounded-2xl p-4 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(160deg, #1A1A0D 0%, #111505 100%)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SportIcon sport={match?.sport ?? bet.sport ?? 'football'} size="sm" />
                        <span className="text-white font-semibold text-sm">
                          {homeTeamEmoji} {homeTeamName} vs {awayTeamEmoji} {awayTeamName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        from <span className="text-white/70 font-medium">{bet.creator.name}</span>
                        {punishment && (
                          <> · <span className="text-amber-400/80">{bet.punishment.reps} {punishment.name}</span></>
                        )}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 border ${
                      alreadyJoined
                        ? 'bg-neon-green/10 border-neon-green/20 text-neon-green'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {alreadyJoined ? '✓ Joined' : 'Invited'}
                    </span>
                  </div>
                  {!alreadyJoined && bet.inviteToken && (
                    <button
                      onClick={() => navigate(`/invite/${bet.inviteToken}`)}
                      className="w-full text-pitch-950 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 2px 12px rgba(245,158,11,0.2)' }}
                    >
                      View &amp; Accept Bet →
                    </button>
                  )}
                  {alreadyJoined && (
                    <button
                      onClick={() => navigate(`/bets/${bet.id}`)}
                      className="w-full bg-white/5 hover:bg-white/8 text-white text-sm font-semibold py-2 rounded-xl transition-colors border border-white/8"
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

      {/* Active Bets */}
      <div className="flex items-center justify-between mb-4 animate-fade-up animate-fill-both animate-delay-400">
        <h2 className="font-display font-bold text-white text-lg">Active Bets</h2>
        <button
          onClick={() => navigate('/create')}
          className="text-sm text-neon-green/80 hover:text-neon-green font-medium transition-colors"
        >
          + New
        </button>
      </div>

      {activeBets.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl transition-all duration-200 animate-fade-up animate-fill-both animate-delay-500"
          style={{ background: 'linear-gradient(160deg, #0D1525 0%, #080C14 100%)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="font-display font-bold text-white text-xl mb-2">No active bets yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Create a bet, share the link with your crew.<br />
            Everyone picks a team — losers do the reps!
          </p>
          <button
            onClick={() => navigate('/create')}
            className="text-pitch-950 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#22D672,#16A350)', boxShadow: '0 2px 16px rgba(34,214,114,0.25)' }}
          >
            Create First Bet
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeBets.map((bet, i) => (
            <div
              key={bet.id}
              className="animate-fade-up animate-fill-both"
              style={{ animationDelay: `${400 + i * 60}ms` }}
            >
              <BetCard bet={bet} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
