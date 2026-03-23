import { NavLink } from 'react-router-dom'
import { useBets } from '../../store/BetContext'

export default function Navbar() {
  const { getActiveBets } = useBets()
  const activeBets = getActiveBets()
  const pendingCount = activeBets.filter((b) => b.status === 'punishment_pending').length

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🏆</span>
          <span className="font-bold text-xl text-white tracking-tight">
            Bet<span className="text-emerald-400">Fit</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            Bets
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center font-bold shadow-sm shadow-red-500/30">
                {pendingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            History
          </NavLink>

          <NavLink
            to="/create"
            className="ml-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-emerald-500/30 hover:shadow-md"
          >
            + New Bet
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
