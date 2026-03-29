import { NavLink } from 'react-router-dom'
import { useBets } from '../../store/BetContext'
import { useAuth } from '../../store/AuthContext'

export default function Navbar() {
  const { getActiveBets, getPendingBets } = useBets()
  const { profile, signOut } = useAuth()
  const activeBets = getActiveBets()
  const pendingBets = getPendingBets()
  const dueCount = activeBets.filter((b) => b.status === 'punishment_pending').length
  const pendingCount = pendingBets.length + dueCount

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(8, 12, 20, 0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: '60px' }}>
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-base transition-all duration-200 group-hover:bg-neon-green/20 group-hover:shadow-glow-green-sm">
            🏆
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            Bet<span className="gradient-text">Fit</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-0.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-neon-green bg-neon-green/8'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                Bets
                {pendingCount > 0 && (
                  <span className={`ml-1.5 text-xs rounded-full w-4 h-4 inline-flex items-center justify-center font-bold ${isActive ? 'bg-neon-green text-pitch-950' : 'bg-red-500 text-white shadow-glow-red'}`}>
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-neon-green bg-neon-green/8'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            History
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-neon-green bg-neon-green/8'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            Leaderboard
          </NavLink>

          <NavLink
            to="/create"
            className="ml-3 px-4 py-1.5 rounded-lg text-sm font-semibold text-pitch-950 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #22D672, #16A350)', boxShadow: '0 2px 12px rgba(34,214,114,0.3)' }}
          >
            + New Bet
          </NavLink>

          {profile && (
            <button
              onClick={signOut}
              title={`Signed in as ${profile.username} — click to sign out`}
              className="ml-2 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center font-display font-bold text-sm text-white transition-all duration-200 hover:border-white/20 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1A2840, #111D30)' }}
            >
              {profile.username[0].toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
