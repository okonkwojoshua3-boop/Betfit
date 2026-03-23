import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BetProvider } from './store/BetContext'
import Navbar from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import CreateBet from './pages/CreateBet'
import BetDetail from './pages/BetDetail'
import History from './pages/History'

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

export default function App() {
  return (
    <BetProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateBet />} />
              <Route path="/bets/:id" element={<BetDetail />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </BetProvider>
  )
}
