import { getPunishmentById, formatPunishment } from '../../data/punishments'
import type { Bet } from '../../types'
import { getMatchById } from '../../data/matches'

interface Props {
  bet: Bet
  onDone: () => void
}

export default function PunishmentBanner({ bet, onDone }: Props) {
  const punishment = getPunishmentById(bet.punishment.punishmentId)
  const match = getMatchById(bet.matchId)

  if (!punishment || !match) return null

  const loserName =
    bet.loserId === 'creator' ? bet.creator.name : bet.opponent.name
  const winnerName =
    bet.loserId === 'creator' ? bet.opponent.name : bet.creator.name

  const loserPick =
    bet.loserId === 'creator'
      ? (match.homeTeam.id === bet.creator.teamPickId ? match.homeTeam : match.awayTeam)
      : (match.homeTeam.id === bet.opponent.teamPickId ? match.homeTeam : match.awayTeam)

  const punishmentText = formatPunishment(punishment, bet.punishment.reps)

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Winner banner at top */}
      <div className="absolute top-6 left-0 right-0 flex justify-center animate-slide-up">
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-5 py-2 text-emerald-400 text-sm font-semibold shadow-sm shadow-emerald-500/10">
          🎉 {winnerName} wins!
        </div>
      </div>

      {/* Main punishment reveal */}
      <div className="animate-bounce-in flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-8xl animate-bounce">{punishment.emoji}</div>

        <div>
          <p className="text-slate-400 text-lg mb-2">Loser is...</p>
          <h1 className="text-5xl font-black text-red-400 tracking-tight uppercase drop-shadow-lg">
            {loserName}
          </h1>
        </div>

        <div className="bg-slate-800/90 border border-red-500/30 rounded-2xl px-8 py-5 w-full shadow-xl shadow-red-500/5">
          <p className="text-slate-400 text-sm mb-1">
            {loserName} backed{' '}
            <span className="text-white font-semibold">
              {loserPick.name}
            </span>{' '}
            and lost.
          </p>
          <p className="text-slate-400 text-sm mb-3">The punishment is:</p>
          <p className="text-3xl font-black text-white">
            {punishmentText}
          </p>
          <p className="text-4xl mt-2">{punishment.emoji}</p>
        </div>

        <button
          onClick={onDone}
          className="w-full bg-red-500 hover:bg-red-400 active:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
        >
          📸 Upload Proof
        </button>
        <p className="text-slate-600 text-xs text-center">
          Take a photo as proof — your opponent must approve it.
        </p>
      </div>
    </div>
  )
}
