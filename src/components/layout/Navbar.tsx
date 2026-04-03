import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useBets } from '../../store/BetContext'
import { useAuth } from '../../store/AuthContext'

export default function Navbar() {
  const { getActiveBets, getPendingBets } = useBets()
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const activeBets = getActiveBets()
  const pendingBets = getPendingBets()
  const dueCount = activeBets.filter((b) => b.status === 'punishment_pending').length
  const pendingCount = pendingBets.length + dueCount

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive ? 'text-neon-green bg-neon-green/8' : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{ background: 'rgba(8, 12, 20, 0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* Main bar */}
      <div className="max-w-4xl mx-auto px-4" style={{ height: '60px' }}>
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-base transition-all duration-200 group-hover:bg-neon-green/20">
              🏆
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Bet<span className="gradient-text">Fit</span>
            </span>
          </NavLink>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0.5">
            <NavLink to="/dashboard" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  Bets
                  {pendingCount > 0 && (
                    <span className={`ml-1.5 text-xs rounded-full w-4 h-4 inline-flex items-center justify-center font-bold ${isActive ? 'bg-neon-green text-pitch-950' : 'bg-red-500 text-white'}`}>
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            <NavLink to="/history" className={navLinkClass}>History</NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>

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

          {/* Mobile right side: New Bet shortcut + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <NavLink
              to="/create"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-pitch-950 transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #22D672, #16A350)' }}
            >
              + New
            </NavLink>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-lg transition-colors hover:bg-white/5 active:bg-white/8"
            >
              <span className={`block w-5 h-[2px] bg-slate-300 rounded-full transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-5 h-[2px] bg-slate-300 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-[2px] bg-slate-300 rounded-full transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden border-t border-white/[0.06] px-3 py-3 space-y-1"
          style={{ background: 'rgba(6, 10, 18, 0.98)' }}
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-neon-green/8 text-neon-green' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            Bets
            {pendingCount > 0 && (
              <span className="ml-auto text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold bg-red-500 text-white">
                {pendingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-neon-green/8 text-neon-green' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            History
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-neon-green/8 text-neon-green' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            Leaderboard
          </NavLink>

          {profile && (
            <>
              <div className="h-px bg-white/[0.06] mx-1 my-2" />
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center font-bold text-xs text-white" style={{ background: 'linear-gradient(135deg,#1A2840,#111D30)' }}>
                  {profile.username[0].toUpperCase()}
                </span>
                <span className="flex-1 text-left">{profile.username}</span>
                <span className="text-xs text-slate-600">Sign out</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
