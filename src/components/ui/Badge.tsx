import type { BetStatus } from '../../types'

const CONFIG: Record<BetStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 ring-0',
  },
  active: {
    label: 'Active',
    className: 'bg-neon-green/10 text-neon-green border border-neon-green/20',
  },
  punishment_pending: {
    label: '🔥 Due',
    className: 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse',
  },
  completed: {
    label: '✓ Done',
    className: 'bg-white/5 text-slate-400 border border-white/8',
  },
  cancel_requested: {
    label: '⏸ Cancelling',
    className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  },
  cancelled: {
    label: '✕ Cancelled',
    className: 'bg-white/5 text-slate-500 border border-white/8',
  },
}

export default function Badge({ status }: { status: BetStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
