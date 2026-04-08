import { useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import BetCard from '../components/bets/BetCard'

function SummaryPill({
  value,
  label,
  color,
  bg,
  border,
}: {
  value: number
  label: string
  color: string
  bg: string
  border: string
}) {
  return (
    <div
      className="flex-1 rounded-2xl py-3 text-center"
      style={{ background: bg, border }}
    >
      <div className={`font-score text-3xl leading-none ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-medium">{label}</div>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const { getCompletedBets } = useBets()
  const { profile } = useAuth()
  const completed = getCompletedBets()

  // Compute personal W/L/D from completed bets
  let wins = 0, losses = 0, draws = 0
  for (const bet of completed) {
    const participants = bet.participants ?? []
    const myParticipant = participants.find((p) => p.userId === profile?.id)

    if (bet.losingTeamId === 'draw') {
      draws++
    } else if (myParticipant && bet.losingTeamId) {
      if (myParticipant.teamPickId === bet.losingTeamId) losses++
      else wins++
    } else if (bet.loserId === 'draw') {
      draws++
    } else if (bet.loserId) {
      const iAmCreator = bet.creatorId === profile?.id
      if ((bet.loserId === 'creator' && iAmCreator) || (bet.loserId === 'opponent' && !iAmCreator)) losses++
      else wins++
    }
  }
  const total = wins + losses + draws
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up animate-fill-both">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1 tracking-tight">
            Bet <span className="gradient-text">History</span>
          </h1>
          <p className="text-slate-500 text-sm">All settled bets and punishments.</p>
        </div>
        {total > 0 && (
          <div
            className="shrink-0 px-3 py-1.5 rounded-xl text-center"
            style={{
              background: winRate >= 50 ? 'rgba(34,214,114,0.08)' : 'rgba(255,255,255,0.04)',
              border: winRate >= 50 ? '1px solid rgba(34,214,114,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className={`font-score text-2xl leading-none ${winRate >= 50 ? 'text-neon-green' : 'text-slate-400'}`}>
              {winRate}%
            </div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">Win rate</div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {total > 0 && (
        <div
          className="flex gap-2 mb-6 animate-fade-up animate-fill-both"
          style={{ animationDelay: '60ms' }}
        >
          <SummaryPill
            value={wins}
            label="Wins"
            color="text-neon-green"
            bg="rgba(34,214,114,0.06)"
            border="1px solid rgba(34,214,114,0.15)"
          />
          <SummaryPill
            value={losses}
            label="Losses"
            color="text-red-400"
            bg="rgba(239,68,68,0.06)"
            border="1px solid rgba(239,68,68,0.15)"
          />
          <SummaryPill
            value={draws}
            label="Draws"
            color="text-slate-400"
            bg="rgba(255,255,255,0.03)"
            border="1px solid rgba(255,255,255,0.07)"
          />
          <SummaryPill
            value={total}
            label="Total"
            color="text-slate-300"
            bg="rgba(255,255,255,0.03)"
            border="1px solid rgba(255,255,255,0.07)"
          />
        </div>
      )}

      {/* Empty state */}
      {completed.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl animate-fade-up animate-fill-both"
          style={{
            background: 'linear-gradient(160deg, #0D1525 0%, #080C14 100%)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <div className="text-5xl mb-4">📜</div>
          <h3 className="font-display font-bold text-white text-xl mb-2">No history yet</h3>
          <p className="text-slate-500 text-sm mb-6">Resolved bets will appear here.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{
              background: 'rgba(34,214,114,0.08)',
              border: '1px solid rgba(34,214,114,0.2)',
              color: '#22D672',
            }}
          >
            ← Back to Active Bets
          </button>
        </div>
      )}

      {/* Bet grid */}
      {completed.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {completed.map((bet, i) => (
            <div
              key={bet.id}
              className="animate-fade-up animate-fill-both"
              style={{ animationDelay: `${120 + i * 50}ms` }}
            >
              <BetCard bet={bet} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
