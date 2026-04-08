import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../store/AuthContext'
import type { LeaderboardEntry } from '../types'

// Per-rank visual treatment
const RANK_CONFIG = [
  {
    icon: '🥇',
    nameColor: 'text-yellow-400',
    background: 'linear-gradient(160deg, #1C1500 0%, #110E00 100%)',
    border: '1px solid rgba(234,179,8,0.35)',
    shine: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.35), transparent)',
    glow: '0 0 24px rgba(234,179,8,0.08), 0 0 48px rgba(234,179,8,0.04)',
  },
  {
    icon: '🥈',
    nameColor: 'text-slate-300',
    background: 'linear-gradient(160deg, #131820 0%, #0A0F18 100%)',
    border: '1px solid rgba(148,163,184,0.25)',
    shine: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.25), transparent)',
    glow: '0 0 24px rgba(148,163,184,0.06)',
  },
  {
    icon: '🥉',
    nameColor: 'text-amber-600',
    background: 'linear-gradient(160deg, #1A0F00 0%, #100A00 100%)',
    border: '1px solid rgba(180,83,9,0.3)',
    shine: 'linear-gradient(90deg, transparent, rgba(180,83,9,0.35), transparent)',
    glow: '0 0 24px rgba(180,83,9,0.08)',
  },
]

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`font-score text-3xl leading-none ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mt-0.5">{label}</div>
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

function PersonalCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mb-8 animate-fade-up animate-fill-both"
      style={{
        background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
        border: '1px solid rgba(34,214,114,0.25)',
        boxShadow: '0 0 32px rgba(34,214,114,0.07), 0 0 64px rgba(34,214,114,0.03)',
      }}
    >
      {/* Top shine */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,214,114,0.5), transparent)' }}
      />

      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">Your Stats</p>
          <h2 className="font-display font-bold text-white text-xl tracking-tight">{entry.username}</h2>
        </div>
        {entry.punishmentsOwed > 0 && (
          <div
            className="shrink-0 px-3 py-1.5 rounded-xl animate-pulse"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              boxShadow: '0 0 12px rgba(239,68,68,0.2)',
            }}
          >
            <span className="text-red-400 text-xs font-bold">
              {entry.punishmentsOwed} punishment{entry.punishmentsOwed > 1 ? 's' : ''} due
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {[
          { value: entry.wins, label: 'W', color: 'text-neon-green' },
          { value: entry.losses, label: 'L', color: 'text-red-400' },
          { value: entry.draws, label: 'D', color: 'text-slate-400' },
          { value: entry.winRate, label: 'Rate %', color: entry.winRate >= 50 ? 'text-neon-green' : 'text-slate-400' },
          { value: entry.punishmentsCompleted, label: 'Done 💪', color: 'text-slate-300' },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            className="rounded-xl py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <StatCell value={value} label={label} color={color} />
          </div>
        ))}
      </div>
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
  const isTop3 = rank < 3
  const cfg = isTop3 ? RANK_CONFIG[rank] : null

  const background = cfg
    ? cfg.background
    : isCurrentUser
      ? 'linear-gradient(160deg, #0D1F12 0%, #080C14 100%)'
      : 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)'

  const border = cfg
    ? cfg.border
    : isCurrentUser
      ? '1px solid rgba(34,214,114,0.25)'
      : '1px solid rgba(255,255,255,0.06)'

  const glow = cfg
    ? cfg.glow
    : isCurrentUser
      ? '0 0 20px rgba(34,214,114,0.06)'
      : 'none'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 animate-fade-up animate-fill-both transition-all duration-200"
      style={{ background, border, boxShadow: glow, animationDelay: `${delay}ms` }}
    >
      {/* Top shine for top 3 and current user */}
      {(isTop3 || isCurrentUser) && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: cfg
              ? cfg.shine
              : 'linear-gradient(90deg, transparent, rgba(34,214,114,0.35), transparent)',
          }}
        />
      )}

      <div className="flex items-center gap-4">
        {/* Rank indicator */}
        <div className="w-10 text-center shrink-0">
          {isTop3 ? (
            <span className="text-2xl leading-none">{cfg!.icon}</span>
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="font-score text-slate-500 text-lg leading-none">#{rank + 1}</span>
            </div>
          )}
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`font-display font-bold text-base tracking-tight ${
                cfg ? cfg.nameColor : isCurrentUser ? 'text-neon-green' : 'text-white'
              }`}
            >
              {entry.username}
            </span>
            {isCurrentUser && !isTop3 && (
              <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">you</span>
            )}
            {isCurrentUser && isTop3 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(34,214,114,0.12)', color: '#22D672', border: '1px solid rgba(34,214,114,0.2)' }}
              >
                you
              </span>
            )}
            {entry.punishmentsOwed > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                {entry.punishmentsOwed} due
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCell value={entry.wins} label="W" color="text-neon-green" />
            <StatCell value={entry.losses} label="L" color="text-red-400" />
            <StatCell value={entry.draws} label="D" color="text-slate-500" />
            <StatCell
              value={entry.winRate}
              label="Rate %"
              color={entry.winRate >= 50 ? 'text-neon-green' : 'text-slate-500'}
            />
          </div>
        </div>

        {/* Punishment completed badge */}
        {entry.punishmentsCompleted > 0 && (
          <div className="shrink-0 text-center">
            <div className="text-xl leading-none">💪</div>
            <div className="text-[10px] text-slate-600 mt-0.5 font-medium">{entry.punishmentsCompleted}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const { entries, loading, error } = useLeaderboard()
  const { profile } = useAuth()

  const myEntry = entries.find((e) => e.userId === profile?.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-up animate-fill-both">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1 tracking-tight">
          Leader<span className="gradient-text">board</span>
        </h1>
        <p className="text-slate-500 text-sm">Ranked by wins across all resolved bets.</p>
      </div>

      {/* Personal stats */}
      {!loading && myEntry && <PersonalCard entry={myEntry} />}

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

      {/* Ranked list */}
      {!loading && !error && entries.length > 0 && (
        <>
          {entries.length > 3 && (
            <div className="flex items-center gap-2 mb-3 animate-fade-up animate-fill-both animate-delay-100">
              <h2 className="font-display font-bold text-white text-lg">Rankings</h2>
              <span
                className="text-[11px] font-bold bg-white/8 text-slate-400 border border-white/10 rounded-full w-5 h-5 inline-flex items-center justify-center"
              >
                {entries.length}
              </span>
            </div>
          )}
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={i}
                isCurrentUser={entry.userId === profile?.id}
                delay={i * 60}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
