import { useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import BetCard from '../components/bets/BetCard'

export default function Dashboard() {
  const navigate = useNavigate()
  const { getActiveBets, bets } = useBets()
  const activeBets = getActiveBets()
  const pendingCount = activeBets.filter((b) => b.status === 'punishment_pending').length
  const totalCompleted = bets.filter((b) => b.status === 'completed').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">
          Bet <span className="text-emerald-400">&</span> Sweat
        </h1>
        <p className="text-slate-400">Bet on the match. Loser does the reps.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-800 border border-slate-700 border-t-2 border-t-emerald-500 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{activeBets.length}</div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Active</div>
        </div>
        <div className={`bg-slate-800 border border-t-2 rounded-xl p-4 text-center transition-colors ${pendingCount > 0 ? 'border-red-500/40 border-t-red-500 shadow-sm shadow-red-500/10' : 'border-slate-700 border-t-slate-600'}`}>
          <div className={`text-3xl font-black transition-colors ${pendingCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {pendingCount}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Due</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 border-t-2 border-t-slate-600 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{totalCompleted}</div>
          <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Done</div>
        </div>
      </div>

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
            Challenge a friend to a match prediction.<br />Loser does the exercise!
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
