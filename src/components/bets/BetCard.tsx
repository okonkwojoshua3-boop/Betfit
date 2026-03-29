import { useNavigate } from 'react-router-dom'
import type { Bet } from '../../types'
import { getMatchById } from '../../data/matches'
import { getPunishmentById } from '../../data/punishments'
import Badge from '../ui/Badge'
import SportIcon from '../ui/SportIcon'

export default function BetCard({ bet }: { bet: Bet }) {
  const navigate = useNavigate()
  const storedMatch = getMatchById(bet.matchId)
  const punishment = getPunishmentById(bet.punishment.punishmentId)

  if (!punishment) return null

  // Resolve team display data: prefer stored match, fall back to bet's own fields
  const sport = storedMatch?.sport ?? bet.sport ?? 'football'
  const homeTeamName = storedMatch?.homeTeam.name ?? bet.homeTeamName ?? 'Home'
  const awayTeamName = storedMatch?.awayTeam.name ?? bet.awayTeamName ?? 'Away'
  const homeTeamEmoji = storedMatch?.homeTeam.emoji ?? bet.homeTeamEmoji ?? '⚽'
  const awayTeamEmoji = storedMatch?.awayTeam.emoji ?? bet.awayTeamEmoji ?? '⚽'
  const homeTeamId = storedMatch?.homeTeam.id ?? bet.homeTeamId ?? 'home'
  const scheduledAt = storedMatch?.scheduledAt ?? bet.matchScheduledAt ?? ''
  const homeScore = bet.homeScore ?? storedMatch?.result?.homeScore
  const awayScore = bet.awayScore ?? storedMatch?.result?.awayScore
  const hasScore = homeScore != null && awayScore != null

  // Kick-off status label
  let statusLabel: string | null = null
  if (storedMatch?.status === 'live') {
    statusLabel = 'LIVE'
  } else if (hasScore || storedMatch?.status === 'finished') {
    statusLabel = 'FT'
  } else if (scheduledAt) {
    const kickoff = new Date(scheduledAt)
    if (kickoff > new Date()) {
      statusLabel = kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
  }

  // Participants for group bets
  const participants = bet.participants ?? []

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
          <SportIcon sport={sport} size="sm" />
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{sport}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusLabel && (
            <span className={`text-xs font-bold ${
              statusLabel === 'LIVE'
                ? 'text-red-400'
                : statusLabel === 'FT'
                  ? 'text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded'
                  : 'text-slate-500'
            }`}>
              {statusLabel === 'LIVE' && <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1" />}
              {statusLabel}
            </span>
          )}
          <Badge status={bet.status} />
        </div>
      </div>

      {/* Match */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-white text-sm truncate">
          {homeTeamEmoji} {homeTeamName}
        </span>
        {hasScore ? (
          <span className="shrink-0 text-sm font-black text-white tabular-nums">
            {homeScore}–{awayScore}
          </span>
        ) : (
          <span className="shrink-0 bg-slate-700 text-slate-400 text-xs font-bold px-1.5 py-0.5 rounded">VS</span>
        )}
        <span className="font-semibold text-white text-sm truncate">
          {awayTeamEmoji} {awayTeamName}
        </span>
      </div>

      {/* Picks */}
      {participants.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {participants.map((p) => {
            const pickedHome = p.teamPickId === homeTeamId
            const isLoser = bet.losingTeamId && bet.losingTeamId !== 'draw' && p.teamPickId === bet.losingTeamId
            return (
              <span
                key={p.userId}
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  isLoser
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : bet.losingTeamId
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-600 bg-slate-700/60 text-slate-300'
                }`}
              >
                {p.username} · {pickedHome ? homeTeamEmoji : awayTeamEmoji}
              </span>
            )
          })}
        </div>
      ) : (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-slate-900/60 rounded-lg px-3 py-2">
            <div className="text-xs text-slate-500 mb-0.5">{bet.creator.name}</div>
            <div className="text-sm font-medium text-white">
              {bet.creator.teamPickId === homeTeamId ? `${homeTeamEmoji}` : `${awayTeamEmoji}`}
            </div>
          </div>
        </div>
      )}

      {/* Punishment */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-400">
          <span>{punishment.emoji}</span>
          <span className="text-xs font-medium">
            {bet.punishment.reps} {punishment.name}
            {punishment.isTimeBased ? ' (secs)' : ''}
          </span>
        </div>
        {bet.status === 'punishment_pending' && bet.losingTeamId && bet.losingTeamId !== 'draw' && (
          <span className="text-xs text-red-400 font-semibold animate-pulse">Losers owe!</span>
        )}
      </div>
    </div>
  )
}
