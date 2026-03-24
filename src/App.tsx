import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import { BetProvider } from './store/BetContext'
import { NotificationProvider } from './store/NotificationContext'
import { PlayerProvider } from './store/PlayerContext'
import Navbar from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import CreateBet from './pages/CreateBet'
import BetDetail from './pages/BetDetail'
import History from './pages/History'
import Leaderboard from './pages/Leaderboard'
import LoginPage from './pages/auth/LoginPage'
import NotificationBanner from './components/ui/NotificationBanner'
import { useMatchSync } from './hooks/useMatchSync'

function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">😅</div>
      <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
      <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
        ← Back to Dashboard
      </a>
    </div>
  )
}

function AppContent() {
  useMatchSync()
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <NotificationBanner />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateBet />} />
          <Route path="/bets/:id" element={<BetDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

// Redirects to /login if not authenticated
function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <BetProvider>
      <PlayerProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </PlayerProvider>
    </BetProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AuthGuard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
