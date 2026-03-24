import { usePlayers } from '../store/PlayerContext'
import { useBets } from '../store/BetContext'
import { getPlayerStats } from '../lib/playerStats'

const RANK_STYLES = [
  'text-yellow-400 text-lg',   // 1st
  'text-slate-300 text-base',  // 2nd
  'text-amber-600 text-base',  // 3rd
]

const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { players } = usePlayers()
  const { bets } = useBets()

  const ranked = players
    .map((p) => ({ player: p, stats: getPlayerStats(p.username ?? '', bets) }))
    .filter((e) => e.stats.totalBets > 0)
    .sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins
      return b.stats.winRate - a.stats.winRate
    })

  const noStats = players.filter((p) => getPlayerStats(p.username ?? '', bets).totalBets === 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-1">Leaderboard</h1>
      <p className="text-slate-400 text-sm mb-8">Ranked by wins across all bets.</p>

      {ranked.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-white mb-2">No stats yet</h3>
          <p className="text-slate-400 text-sm">
            Stats appear once bets are resolved.
          </p>
        </div>
      )}

      {ranked.length > 0 && (
        <div className="space-y-3 mb-8">
          {ranked.map(({ player, stats }, i) => (
            <div
              key={player.id}
              className={`bg-slate-800 border rounded-2xl p-4 transition-all ${
                i === 0
                  ? 'border-yellow-500/30 shadow-md shadow-yellow-500/5'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{RANK_ICONS[i]}</span>
                  ) : (
                    <span className={`font-black text-slate-500 text-lg`}>#{i + 1}</span>
                  )}
                </div>

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold ${i < 3 ? RANK_STYLES[i] : 'text-white'}`}>
                      {player.username}
                    </span>
                    {stats.punishmentsPending > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                        {stats.punishmentsPending} due
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-emerald-400 font-black text-lg leading-none">{stats.wins}</div>
                      <div className="text-slate-500 text-xs mt-0.5">W</div>
                    </div>
                    <div>
                      <div className="text-red-400 font-black text-lg leading-none">{stats.losses}</div>
                      <div className="text-slate-500 text-xs mt-0.5">L</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-black text-lg leading-none">{stats.draws}</div>
                      <div className="text-slate-500 text-xs mt-0.5">D</div>
                    </div>
                    <div>
                      <div className={`font-black text-lg leading-none ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {stats.winRate}%
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">Rate</div>
                    </div>
                  </div>
                </div>

                {/* Punishment badge */}
                {stats.punishmentsCompleted > 0 && (
                  <div className="shrink-0 text-center">
                    <div className="text-2xl">💪</div>
                    <div className="text-xs text-slate-500">{stats.punishmentsCompleted}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Players with no bets yet */}
      {noStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">No bets yet</h2>
          <div className="flex flex-wrap gap-2">
            {noStats.map((p) => (
              <span
                key={p.id}
                className="bg-slate-800 border border-slate-700 text-slate-400 text-sm px-3 py-1.5 rounded-lg"
              >
                {p.username ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
