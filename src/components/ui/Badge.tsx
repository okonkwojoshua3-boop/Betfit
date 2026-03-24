import type { BetStatus } from '../../types'

const CONFIG: Record<BetStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  active: { label: 'Active', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  punishment_pending: { label: '🔥 Due', className: 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' },
  completed: { label: 'Completed', className: 'bg-slate-600/40 text-slate-400 border border-slate-600/30' },
}

export default function Badge({ status }: { status: BetStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
