import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../store/AuthContext'
import Avatar from '../components/ui/Avatar'
import type { LeaderboardEntry } from '../types'

function TrophyIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

const RANK_CONFIG = [
  {
    icon: '🥇',
    nameColor: 'text-yellow-400',
    background: 'linear-gradient(160deg, #1C1500 0%, #110E00 100%)',
    border: '1px solid rgba(234,179,8,0.35)',
    shine: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.4), transparent)',
    glow: '0 0 32px rgba(234,179,8,0.12), 0 0 64px rgba(234,179,8,0.05)',
    accentBar: 'rgba(234,179,8,0.7)',
    rateColor: '#FBBF24',
  },
  {
    icon: '🥈',
    nameColor: 'text-slate-300',
    background: 'linear-gradient(160deg, #131820 0%, #0A0F18 100%)',
    border: '1px solid rgba(148,163,184,0.25)',
    shine: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.25), transparent)',
    glow: '0 0 24px rgba(148,163,184,0.06)',
    accentBar: 'rgba(148,163,184,0.5)',
    rateColor: '#94A3B8',
  },
  {
    icon: '🥉',
    nameColor: 'text-amber-600',
    background: 'linear-gradient(160deg, #1A0F00 0%, #100A00 100%)',
    border: '1px solid rgba(180,83,9,0.3)',
    shine: 'linear-gradient(90deg, transparent, rgba(180,83,9,0.35), transparent)',
    glow: '0 0 24px rgba(180,83,9,0.08)',
    accentBar: 'rgba(180,83,9,0.6)',
    rateColor: '#D97706',
  },
]

function WinRateBar({ rate, color }: { rate: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(rate, 100)}%`, background: color }}
      />
    </div>
  )
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{
        background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-9 bg-white/5 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3.5 bg-white/5 rounded-lg w-2/5" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PodiumCard({
  entry,
  rank,
  isCurrentUser,
  delay,
}: {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser: boolean
  delay: number
}) {
  const cfg = RANK_CONFIG[rank]
  const isFirst = rank === 0

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex flex-col items-center text-center animate-fade-up animate-fill-both transition-transform duration-200 ${isFirst ? 'py-5 px-3' : 'py-4 px-3'}`}
      style={{
        background: cfg.background,
        border: cfg.border,
        boxShadow: cfg.glow,
        animationDelay: `${delay}ms`,
        flex: isFirst ? '1.15' : '1',
      }}
    >
      {/* top shine */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: cfg.shine }} />
      {/* left accent */}
      <div className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-2xl" style={{ background: cfg.accentBar }} />

      <div className={`${isFirst ? 'text-4xl' : 'text-2xl'} leading-none mb-2`}>{cfg.icon}</div>

      <div className="mb-2">
        <Avatar url={entry.avatarUrl} username={entry.username} size={isFirst ? 'md' : 'sm'} />
      </div>

      <p
        className={`font-display font-bold tracking-tight leading-tight break-all ${isFirst ? 'text-sm' : 'text-xs'} ${cfg.nameColor}`}
        style={{ maxWidth: '100%', wordBreak: 'break-word' }}
      >
        {entry.username}
        {isCurrentUser && (
          <span
            className="block text-[9px] font-bold mt-0.5 px-1.5 py-px rounded-md w-fit mx-auto"
            style={{ background: 'rgba(34,214,114,0.12)', color: '#22D672', border: '1px solid rgba(34,214,114,0.2)' }}
          >
            you
          </span>
        )}
      </p>

      <div className="mt-3 mb-1">
        <div className={`font-score leading-none ${isFirst ? 'text-4xl' : 'text-3xl'} text-white`}>
          {entry.wins}
        </div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Wins</div>
      </div>

      <div className="w-full mt-2 px-1">
        <WinRateBar rate={entry.winRate} color={cfg.rateColor} />
        <div className="text-[9px] mt-1 font-medium" style={{ color: cfg.rateColor }}>
          {entry.winRate}%
        </div>
      </div>

      {entry.punishmentsOwed > 0 && (
        <div
          className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          {entry.punishmentsOwed} due
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  delay,
}: {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser: boolean
  delay: number
}) {
  const background = isCurrentUser
    ? 'linear-gradient(160deg, #0D1F12 0%, #080C14 100%)'
    : 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)'
  const border = isCurrentUser
    ? '1px solid rgba(34,214,114,0.25)'
    : '1px solid rgba(255,255,255,0.06)'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 animate-fade-up animate-fill-both"
      style={{ background, border, animationDelay: `${delay}ms` }}
    >
      {isCurrentUser && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,214,114,0.4), transparent)' }} />
      )}

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="font-score text-slate-500 text-xs leading-none">#{rank + 1}</span>
          </div>
          <Avatar url={entry.avatarUrl} username={entry.username} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className={`font-display font-bold text-sm tracking-tight truncate ${isCurrentUser ? 'text-neon-green' : 'text-white'}`}>
              {entry.username}
            </span>
            {isCurrentUser && (
              <span
                className="text-[9px] font-bold px-1.5 py-px rounded-md shrink-0"
                style={{ background: 'rgba(34,214,114,0.12)', color: '#22D672', border: '1px solid rgba(34,214,114,0.2)' }}
              >
                you
              </span>
            )}
            {entry.punishmentsOwed > 0 && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                {entry.punishmentsOwed} due
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2.5">
            {[
              { value: entry.wins, label: 'W', color: 'text-neon-green' },
              { value: entry.losses, label: 'L', color: 'text-red-400' },
              { value: entry.draws, label: 'D', color: 'text-slate-500' },
              { value: entry.winRate, label: 'Rate %', color: entry.winRate >= 50 ? 'text-neon-green' : 'text-slate-500' },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`font-score text-2xl leading-none ${color}`}>{value}</div>
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <WinRateBar
            rate={entry.winRate}
            color={isCurrentUser ? '#22D672' : entry.winRate >= 50 ? '#22D672' : '#475569'}
          />
        </div>

        {entry.punishmentsCompleted > 0 && (
          <div className="shrink-0 text-center ml-1">
            <div className="text-lg leading-none">💪</div>
            <div className="text-[9px] text-slate-600 mt-0.5 font-medium">{entry.punishmentsCompleted}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function PersonalCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const rankLabel = rank === 0 ? '🥇 #1' : rank === 1 ? '🥈 #2' : rank === 2 ? '🥉 #3' : `#${rank + 1}`

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mb-8 animate-fade-up animate-fill-both"
      style={{
        background: 'linear-gradient(160deg, #0D1F12 0%, #080C14 100%)',
        border: '1px solid rgba(34,214,114,0.25)',
        boxShadow: '0 0 32px rgba(34,214,114,0.07), 0 0 64px rgba(34,214,114,0.03)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,214,114,0.5), transparent)' }} />
      <div className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-2xl" style={{ background: 'rgba(34,214,114,0.6)' }} />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar url={entry.avatarUrl} username={entry.username} size="lg" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-0.5">Your Stats</p>
            <h2 className="font-display font-bold text-neon-green text-xl tracking-tight leading-tight">{entry.username}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(34,214,114,0.08)', border: '1px solid rgba(34,214,114,0.2)', color: '#22D672' }}
          >
            {rankLabel}
          </div>
          {entry.punishmentsOwed > 0 && (
            <div
              className="px-3 py-1.5 rounded-xl animate-pulse"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 12px rgba(239,68,68,0.2)' }}
            >
              <span className="text-red-400 text-xs font-bold">
                {entry.punishmentsOwed} punishment{entry.punishmentsOwed > 1 ? 's' : ''} due
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {[
          { value: entry.wins, label: 'W', color: 'text-neon-green' },
          { value: entry.losses, label: 'L', color: 'text-red-400' },
          { value: entry.draws, label: 'D', color: 'text-slate-400' },
          { value: entry.winRate, label: 'Rate %', color: entry.winRate >= 50 ? 'text-neon-green' : 'text-slate-400' },
          { value: entry.punishmentsCompleted, label: 'Done 💪', color: 'text-slate-300' },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            className="rounded-xl py-2.5 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className={`font-score text-2xl leading-none ${color}`}>{value}</div>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <WinRateBar rate={entry.winRate} color="#22D672" />
      <p className="text-[10px] text-slate-600 mt-1.5">
        Win rate — {entry.wins} win{entry.wins !== 1 ? 's' : ''} from {entry.wins + entry.losses + entry.draws} resolved bet{entry.wins + entry.losses + entry.draws !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function Leaderboard() {
  const { entries, loading, error } = useLeaderboard()
  const { profile } = useAuth()

  const myEntry = entries.find((e) => e.userId === profile?.id)
  const myRank = entries.findIndex((e) => e.userId === profile?.id)

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  // Podium display order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-up animate-fill-both flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1 tracking-tight">
            Leader<span className="gradient-text">board</span>
          </h1>
          <p className="text-slate-500 text-sm">Ranked by wins across all resolved bets.</p>
        </div>
        <div
          className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(34,214,114,0.15), rgba(34,214,114,0.05))', border: '1px solid rgba(34,214,114,0.2)' }}
        >
          <TrophyIcon size={22} className="text-neon-green" />
        </div>
      </div>

      {/* Personal stats */}
      {!loading && myEntry && <PersonalCard entry={myEntry} rank={myRank} />}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          <SkeletonRow delay={0} />
          <SkeletonRow delay={60} />
          <SkeletonRow delay={120} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="text-center py-8 text-red-400 text-sm rounded-2xl px-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl animate-fade-up animate-fill-both"
          style={{ background: 'linear-gradient(160deg, #0D1525 0%, #080C14 100%)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="font-display font-bold text-white text-xl mb-2">No stats yet</h3>
          <p className="text-slate-500 text-sm">Stats appear once bets are resolved.</p>
        </div>
      )}

      {/* Podium — top 3 */}
      {!loading && !error && top3.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4 animate-fade-up animate-fill-both">
            <h2 className="font-display font-bold text-white text-lg">Rankings</h2>
            <span
              className="text-[11px] font-bold bg-white/5 text-slate-400 border border-white/10 rounded-full w-6 h-6 inline-flex items-center justify-center"
            >
              {entries.length}
            </span>
          </div>

          {/* Podium — 2nd / 1st / 3rd */}
          <div className="flex gap-2 mb-3 items-end animate-fade-up animate-fill-both animate-delay-100">
            {podiumOrder.map((entry, podiumIdx) => {
              const realRank = entries.findIndex(e => e.userId === entry.userId)
              return (
                <PodiumCard
                  key={entry.userId}
                  entry={entry}
                  rank={realRank}
                  isCurrentUser={entry.userId === profile?.id}
                  delay={podiumIdx * 60}
                />
              )
            })}
          </div>
        </>
      )}

      {/* Ranks 4+ */}
      {!loading && !error && rest.length > 0 && (
        <div className="space-y-2 mt-2">
          {rest.map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              rank={i + 3}
              isCurrentUser={entry.userId === profile?.id}
              delay={i * 50}
            />
          ))}
        </div>
      )}
    </div>
  )
}
