import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bet, Match, Sport } from '../../types'
import { getMatchById } from '../../data/matches'
import { getPunishmentById } from '../../data/punishments'
import { useLiveScore } from '../../hooks/useLiveScore'
import { useBets } from '../../store/BetContext'
import { useAuth } from '../../store/AuthContext'
import Badge from '../ui/Badge'
import SportIcon from '../ui/SportIcon'
import TeamLogo from '../ui/TeamLogo'

export default function BetCard({ bet }: { bet: Bet }) {
  const navigate = useNavigate()
  const { declineBet, requestCancel } = useBets()
  const { profile } = useAuth()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const storedMatch = getMatchById(bet.matchId)
  const punishment = getPunishmentById(bet.punishment.punishmentId)
  const betSettled = bet.status === 'punishment_pending' || bet.status === 'completed'

  // Stable match reference for useLiveScore — memoised by matchId (never changes for a given bet).
  // getMatchById parses localStorage each render, returning a new object reference every time,
  // which would reset the polling interval on every render without this memo.
  const matchForLive = useMemo<Match | undefined>(() => {
    const stored = getMatchById(bet.matchId)
    return stored ?? (
      bet.homeTeamId && bet.awayTeamId
        ? {
            id: bet.matchId,
            sport: (bet.sport ?? 'football') as Sport,
            homeTeam: {
              id: bet.homeTeamId,
              name: bet.homeTeamName ?? 'Home',
              shortCode: (bet.homeTeamName ?? 'HOM').slice(0, 3).toUpperCase(),
              badgeColor: '',
              emoji: bet.homeTeamEmoji ?? '⚽',
            },
            awayTeam: {
              id: bet.awayTeamId,
              name: bet.awayTeamName ?? 'Away',
              shortCode: (bet.awayTeamName ?? 'AWY').slice(0, 3).toUpperCase(),
              badgeColor: '',
              emoji: bet.awayTeamEmoji ?? '⚽',
            },
            scheduledAt: bet.matchScheduledAt ?? bet.createdAt,
            status: 'upcoming',
          }
        : undefined
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bet.matchId])

  // Must be called unconditionally before any early return (Rules of Hooks).
  // BetCard doesn't settle bets — onFinished is a noop; BetDetail handles resolution.
  const liveData = useLiveScore(matchForLive, betSettled, () => {})

  if (!punishment) return null

  const sport = storedMatch?.sport ?? bet.sport ?? 'football'
  const homeTeamName = storedMatch?.homeTeam.name ?? bet.homeTeamName ?? 'Home'
  const awayTeamName = storedMatch?.awayTeam.name ?? bet.awayTeamName ?? 'Away'
  const homeTeamEmoji = storedMatch?.homeTeam.emoji ?? bet.homeTeamEmoji ?? '⚽'
  const awayTeamEmoji = storedMatch?.awayTeam.emoji ?? bet.awayTeamEmoji ?? '⚽'
  const homeTeamLogo = storedMatch?.homeTeam.logo ?? bet.homeTeamLogo
  const awayTeamLogo = storedMatch?.awayTeam.logo ?? bet.awayTeamLogo
  const homeTeamId = storedMatch?.homeTeam.id ?? bet.homeTeamId ?? 'home'
  const awayTeamId = storedMatch?.awayTeam.id ?? bet.awayTeamId ?? 'away'
  const scheduledAt = storedMatch?.scheduledAt ?? bet.matchScheduledAt ?? ''
  // liveData scores come directly from ESPN — trusted for live and finished matches.
  // For settled bets fall back to DB scores. Never use DB scores for unresolved bets
  // (ESPN returns 0-0 for pre-match events and the DB defaults to 0).
  const liveActive = liveData?.isLive || liveData?.isHalfTime || liveData?.isFinished
  const homeScore = liveActive
    ? (liveData?.homeScore ?? null)
    : betSettled
      ? (bet.homeScore ?? storedMatch?.result?.homeScore ?? null)
      : null
  const awayScore = liveActive
    ? (liveData?.awayScore ?? null)
    : betSettled
      ? (bet.awayScore ?? storedMatch?.result?.awayScore ?? null)
      : null
  const hasScore = homeScore != null && awayScore != null

  const isLive = liveData?.isLive ?? storedMatch?.status === 'live'
  let statusLabel: string | null = null
  if (liveData?.isLive) {
    statusLabel = liveData.statusText
  } else if (liveData?.isFinished || hasScore || storedMatch?.status === 'finished') {
    statusLabel = liveData?.statusText ?? storedMatch?.statusText ?? 'FT'
  } else if (storedMatch?.status === 'live') {
    statusLabel = storedMatch.statusText ?? 'LIVE'
  } else if (scheduledAt) {
    const kickoff = new Date(scheduledAt)
    if (kickoff > new Date()) {
      statusLabel = kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
  }

  const participants = bet.participants ?? []
  const isPunishmentDue = bet.status === 'punishment_pending'
  const isCreator = bet.creatorId === profile?.id
  const isCancellable = isCreator && (bet.status === 'pending' || bet.status === 'active')

  async function handleCancelConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    const others = participants.filter((p) => p.userId !== profile?.id)
    if (others.length === 0) {
      await declineBet(bet.id)
    } else {
      await requestCancel(bet.id, others)
    }
    setConfirmCancel(false)
  }

  return (
    <div
      onClick={() => navigate(`/bets/${bet.id}`)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 group
        hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.99]
        ${isPunishmentDue ? 'shadow-glow-red' : 'shadow-card'}`}
      style={{
        background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
        border: isPunishmentDue ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: isPunishmentDue
            ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(34,214,114,0.3), transparent)',
        }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
              <SportIcon sport={sport} size="sm" />
            </div>
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">{sport}</span>
            {statusLabel && isLive && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {statusLabel}
              </span>
            )}
            {statusLabel && !isLive && (
              <span className="text-[11px] font-semibold text-slate-500 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full">
                {statusLabel}
              </span>
            )}
          </div>
          <Badge status={bet.status} />
        </div>

        {/* Match — broadcast style */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamLogo name={homeTeamName} logo={homeTeamLogo} teamId={homeTeamId} sport={sport} emoji={homeTeamEmoji} size="md" />
            <span className="text-xs font-semibold text-white text-center truncate w-full max-w-[80px] mx-auto leading-tight">
              {homeTeamName}
            </span>
          </div>

          <div className="flex-shrink-0 mx-3 text-center">
            {hasScore ? (
              <div className="font-score text-3xl text-white leading-none tracking-wide">
                {homeScore}<span className="text-slate-500 mx-1">–</span>{awayScore}
              </div>
            ) : (
              <span className="font-score text-xl text-slate-500 tracking-widest">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamLogo name={awayTeamName} logo={awayTeamLogo} teamId={awayTeamId} sport={sport} emoji={awayTeamEmoji} size="md" />
            <span className="text-xs font-semibold text-white text-center truncate w-full max-w-[80px] mx-auto leading-tight">
              {awayTeamName}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-3" />

        {/* Participants — horizontal scroll row */}
        {participants.length > 0 ? (
          <div className="relative mb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {participants.map((p) => {
                const pickedHome = p.teamPickId === homeTeamId
                const isLoser = bet.losingTeamId && bet.losingTeamId !== 'draw' && p.teamPickId === bet.losingTeamId
                const isWinner = bet.losingTeamId && bet.losingTeamId !== 'draw' && p.teamPickId !== bet.losingTeamId
                return (
                  <div
                    key={p.userId}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{
                      minWidth: '100px',
                      background: isLoser
                        ? 'rgba(239,68,68,0.08)'
                        : isWinner
                          ? 'rgba(34,214,114,0.08)'
                          : 'rgba(255,255,255,0.04)',
                      border: isLoser
                        ? '1px solid rgba(239,68,68,0.2)'
                        : isWinner
                          ? '1px solid rgba(34,214,114,0.2)'
                          : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <span className="text-sm shrink-0">{pickedHome ? homeTeamEmoji : awayTeamEmoji}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 truncate leading-none mb-0.5">{p.username}</div>
                      <div className={`text-[11px] font-semibold truncate leading-none ${isLoser ? 'text-red-400' : isWinner ? 'text-neon-green' : 'text-slate-300'}`}>
                        {pickedHome ? homeTeamName.split(' ')[0] : awayTeamName.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Right fade hint */}
            {participants.length > 2 && (
              <div className="absolute right-0 top-0 bottom-0.5 w-8 pointer-events-none rounded-r-xl" style={{ background: 'linear-gradient(to right, transparent, rgba(13,21,37,0.9))' }} />
            )}
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            <div className="flex-1 rounded-xl px-3 py-2 bg-white/[0.03] border border-white/5">
              <div className="text-[11px] text-slate-600 mb-0.5">{bet.creator.name}</div>
              <div className="text-sm font-medium text-white">
                {bet.creator.teamPickId === homeTeamId ? homeTeamEmoji : awayTeamEmoji}
              </div>
            </div>
          </div>
        )}

        {/* Punishment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{punishment.emoji}</span>
            <span className="text-xs font-medium text-amber-400/80">
              {bet.punishment.reps} {punishment.name}{punishment.isTimeBased ? ' secs' : ''}
            </span>
          </div>
          {isPunishmentDue && bet.losingTeamId !== 'draw' && (
            <span className="text-[11px] text-red-400 font-bold tracking-wide animate-pulse">LOSERS OWE</span>
          )}
          {!isPunishmentDue && !isCancellable && (
            <span className="text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors">View →</span>
          )}
          {isCancellable && !confirmCancel && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmCancel(true) }}
              className="text-[11px] text-slate-600 hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Inline cancel confirmation */}
        {confirmCancel && (
          <div
            className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-slate-400">
              {participants.filter((p) => p.userId !== profile?.id).length === 0
                ? 'Cancel this bet?'
                : 'Request cancellation? Others will be notified.'}
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmCancel(false) }}
                className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-lg bg-white/5 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleCancelConfirm}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 transition-colors"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
