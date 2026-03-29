import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../store/NotificationContext'

export default function NotificationBanner() {
  const { unread, markAllRead } = useNotifications()
  const navigate = useNavigate()

  if (unread.length === 0) return null

  return (
    <div style={{ background: 'linear-gradient(90deg, rgba(13,21,37,0.98), rgba(17,29,48,0.98))', borderBottom: '1px solid rgba(245,158,11,0.2)' }} className="px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <span className="font-display font-bold text-sm text-amber-400">
              {unread.length} new {unread.length === 1 ? 'notification' : 'notifications'}
            </span>
          </div>
          <button
            onClick={markAllRead}
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
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
              className="w-full text-left rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 hover:border-amber-500/30 active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-sm text-slate-300 leading-snug">{n.message}</p>
              <span className="text-slate-600 text-xs shrink-0 font-medium">View →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
