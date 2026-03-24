import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../store/NotificationContext'

export default function NotificationBanner() {
  const { unread, markAllRead } = useNotifications()
  const navigate = useNavigate()

  if (unread.length === 0) return null

  return (
    <div className="bg-slate-900 border-b border-amber-500/30 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <span className="text-amber-400 font-bold text-sm">
              {unread.length} bet result{unread.length > 1 ? 's' : ''} updated
            </span>
          </div>
          <button
            onClick={markAllRead}
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            Dismiss all
          </button>
        </div>

        <div className="space-y-2">
          {unread.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                navigate(`/bets/${n.betId}`)
                markAllRead()
              }}
              className="w-full text-left bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors"
            >
              <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
              <span className="text-slate-500 text-xs shrink-0">View →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
