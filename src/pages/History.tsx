import { useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import BetCard from '../components/bets/BetCard'

export default function History() {
  const navigate = useNavigate()
  const { getCompletedBets } = useBets()
  const completed = getCompletedBets()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-white mb-1">History</h1>
      <p className="text-slate-400 mb-8">All settled bets and punishments.</p>

      {completed.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-700 hover:border-slate-600 rounded-2xl transition-colors bg-slate-900/30">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-bold text-white mb-2">No completed bets yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Resolve your active bets to see them here.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
          >
            ← Back to Active Bets
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {completed.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  )
}
