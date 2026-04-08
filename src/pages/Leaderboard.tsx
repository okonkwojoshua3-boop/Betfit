import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../store/AuthContext'
import type { LeaderboardEntry } from '../types'

const RANK_ICONS = ['🥇', '🥈', '🥉']
const RANK_STYLES = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`font-black text-lg leading-none ${color}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-8 bg-slate-700 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-700 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-700 rounded" />
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
      className="rounded-2xl p-5 mb-8 animate-fade-up animate-fill-both"
      style={{ background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)', border: '1px solid rgba(34,197,94,0.2)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Your Stats</p>
          <h2 className="text-white font-bold text-lg">{entry.username}</h2>
        </div>
        {entry.punishmentsOwed > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full animate-pulse font-semibold">
            {entry.punishmentsOwed} punishment{entry.punishmentsOwed > 1 ? 's' : ''} due
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        <StatCell value={entry.wins} label="W" color="text-neon-green" />
        <StatCell value={entry.losses} label="L" color="text-red-400" />
        <StatCell value={entry.draws} label="D" color="text-slate-400" />
        <StatCell value={entry.winRate} label="Rate %" color={entry.winRate >= 50 ? 'text-neon-green' : 'text-slate-400'} />
        <StatCell value={entry.punishmentsCompleted} label="Done 💪" color="text-slate-300" />
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, rank, isCurrentUser }: { entry: LeaderboardEntry; rank: number; isCurrentUser: boolean }) {
  const isTop3 = rank < 3
  return (
    <div
      className={`bg-slate-800 rounded-2xl p-4 transition-all ${
        rank === 0
          ? 'border border-yellow-500/30 shadow-md shadow-yellow-500/5'
          : isCurrentUser
            ? 'border border-neon-green/30'
            : 'border border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="w-10 text-center shrink-0">
          {isTop3 ? (
            <span className="text-2xl">{RANK_ICONS[rank]}</span>
          ) : (
            <span className="font-black text-slate-500 text-lg">#{rank + 1}</span>
          )}
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`font-bold ${isTop3 ? RANK_STYLES[rank] : isCurrentUser ? 'text-neon-green' : 'text-white'}`}>
              {entry.username}
            </span>
            {isCurrentUser && (
              <span className="text-xs text-slate-500 font-normal">(you)</span>
            )}
            {entry.punishmentsOwed > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                {entry.punishmentsOwed} due
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCell value={entry.wins} label="W" color="text-emerald-400" />
            <StatCell value={entry.losses} label="L" color="text-red-400" />
            <StatCell value={entry.draws} label="D" color="text-slate-400" />
            <StatCell
              value={entry.winRate}
              label="Rate %"
              color={entry.winRate >= 50 ? 'text-emerald-400' : 'text-slate-400'}
            />
          </div>
        </div>

        {/* Completed punishments badge */}
        {entry.punishmentsCompleted > 0 && (
          <div className="shrink-0 text-center">
            <div className="text-2xl">💪</div>
            <div className="text-xs text-slate-500">{entry.punishmentsCompleted}</div>
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
      <h1 className="text-2xl font-black text-white mb-1">Leaderboard</h1>
      <p className="text-slate-400 text-sm mb-8">Ranked by wins across all resolved bets.</p>

      {/* Personal stats */}
      {!loading && myEntry && <PersonalCard entry={myEntry} />}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl px-4">
          {error}
        </div>
      )}

      {/* Leaderboard */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-white mb-2">No stats yet</h3>
          <p className="text-slate-400 text-sm">Stats appear once bets are resolved.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              rank={i}
              isCurrentUser={entry.userId === profile?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
