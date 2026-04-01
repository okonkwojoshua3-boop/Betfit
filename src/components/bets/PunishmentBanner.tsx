import { useRef } from 'react'
import { getPunishmentById } from '../../data/punishments'
import { useProof } from '../../hooks/useProof'
import type { Bet, Match } from '../../types'

interface Props {
  bet: Bet
  match: Match
  punishmentText: string
  onDone: () => void
}

export default function PunishmentBanner({ bet, match, punishmentText, onDone }: Props) {
  const punishment = getPunishmentById(bet.punishment.punishmentId)
  const { uploadProof, uploading } = useProof(bet.id)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!punishment) return null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadProof(file)
    onDone()
  }

  const participants = bet.participants ?? []
  const winners = participants.filter((p) => p.teamPickId !== bet.losingTeamId)
  const winnerNames = winners.map((p) => p.username).join(' & ') || 'Your opponent'

  // Which team did the current user (loser) pick?
  const losingTeam =
    match.homeTeam.id === bet.losingTeamId ? match.homeTeam : match.awayTeam

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Winner banner */}
      <div className="absolute top-6 left-0 right-0 flex justify-center">
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-5 py-2 text-emerald-400 text-sm font-semibold shadow-sm shadow-emerald-500/10">
          🎉 {winnerNames} win{winners.length === 1 ? 's' : ''}!
        </div>
      </div>

      {/* Main reveal */}
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-8xl animate-bounce">{punishment.emoji}</div>

        <div>
          <p className="text-slate-400 text-lg mb-2">
            You backed {losingTeam.emoji} {losingTeam.name}...
          </p>
          <h1 className="text-5xl font-black text-red-400 tracking-tight uppercase drop-shadow-lg">
            You Lost!
          </h1>
        </div>

        <div className="bg-slate-800/90 border border-red-500/30 rounded-2xl px-8 py-5 w-full shadow-xl shadow-red-500/5">
          <p className="text-slate-400 text-sm mb-3">Your punishment:</p>
          <p className="text-3xl font-black text-white">{punishmentText}</p>
          <p className="text-4xl mt-2">{punishment.emoji}</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-red-500 hover:bg-red-400 active:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
        >
          {uploading ? 'Uploading…' : '📸 Upload Proof'}
        </button>
        <p className="text-slate-600 text-xs text-center">
          Take a photo or video — your opponent must approve it.
        </p>
      </div>
    </div>
  )
}
