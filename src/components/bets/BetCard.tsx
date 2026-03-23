import { useNavigate } from 'react-router-dom'
import type { Bet } from '../../types'
import { getMatchById } from '../../data/matches'
import { getPunishmentById } from '../../data/punishments'
import Badge from '../ui/Badge'
import SportIcon from '../ui/SportIcon'

export default function BetCard({ bet }: { bet: Bet }) {
  const navigate = useNavigate()
  const match = getMatchById(bet.matchId)
  const punishment = getPunishmentById(bet.punishment.punishmentId)

  if (!match || !punishment) return null

  const creatorTeam = match.homeTeam.id === bet.creator.teamPickId ? match.homeTeam : match.awayTeam
  const opponentTeam = match.homeTeam.id === bet.opponent.teamPickId ? match.homeTeam : match.awayTeam

  const loserName =
    bet.loserId === 'creator'
      ? bet.creator.name
      : bet.loserId === 'opponent'
        ? bet.opponent.name
        : null

  return (
    <div
      onClick={() => navigate(`/bets/${bet.id}`)}
      className={`bg-slate-800 border rounded-xl p-4 cursor-pointer hover:bg-slate-700/50 hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group ${
        bet.status === 'punishment_pending'
          ? 'border-red-500/50 shadow-red-500/10 shadow-lg'
          : 'border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SportIcon sport={match.sport} size="sm" />
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
            {match.sport}
          </span>
        </div>
        <Badge status={bet.status} />
      </div>

      {/* Match */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-white text-sm truncate">
          {match.homeTeam.name}
        </span>
        <span className="shrink-0 bg-slate-700 text-slate-400 text-xs font-bold px-1.5 py-0.5 rounded">VS</span>
        <span className="font-semibold text-white text-sm truncate">
          {match.awayTeam.name}
        </span>
        {match.result && (
          <span className="ml-auto shrink-0 text-sm font-black text-white tabular-nums">
            {match.result.homeScore}–{match.result.awayScore}
          </span>
        )}
      </div>

      {/* Picks */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-slate-900/60 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-500 mb-0.5">{bet.creator.name}</div>
          <div className="text-sm font-medium text-white flex items-center gap-1">
            <span>{creatorTeam.emoji}</span>
            <span>{creatorTeam.shortCode}</span>
          </div>
        </div>
        <div className="flex-1 bg-slate-900/60 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-500 mb-0.5">{bet.opponent.name}</div>
          <div className="text-sm font-medium text-white flex items-center gap-1">
            <span>{opponentTeam.emoji}</span>
            <span>{opponentTeam.shortCode}</span>
          </div>
        </div>
      </div>

      {/* Punishment */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-400">
          <span>{punishment.emoji}</span>
          <span className="text-xs font-medium">
            {bet.punishment.reps} {punishment.name}
            {punishment.isTimeBased ? ' (secs)' : ''}
          </span>
        </div>
        {bet.status === 'completed' && loserName && (
          <span className="text-xs text-slate-500">
            {loserName} owed this
          </span>
        )}
        {bet.status === 'punishment_pending' && loserName && (
          <span className="text-xs text-red-400 font-semibold animate-pulse">
            {loserName} owes this!
          </span>
        )}
      </div>
    </div>
  )
}
