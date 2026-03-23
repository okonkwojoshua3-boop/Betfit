import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { getMatchById } from '../data/matches'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import PunishmentBanner from '../components/bets/PunishmentBanner'
import Badge from '../components/ui/Badge'
import SportIcon from '../components/ui/SportIcon'

export default function BetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBetById, resolveBet, acknowledgePunishment } = useBets()

  const bet = id ? getBetById(id) : undefined
  const match = bet ? getMatchById(bet.matchId) : undefined
  const punishment = bet ? getPunishmentById(bet.punishment.punishmentId) : undefined

  const [showModal, setShowModal] = useState(false)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [winnerOverride, setWinnerOverride] = useState<string>('score') // 'score' | team id | 'draw'

  if (!bet || !match || !punishment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-white mb-2">Bet not found</h2>
        <button onClick={() => navigate('/dashboard')} className="text-emerald-400 hover:text-emerald-300">
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const creatorTeam = match.homeTeam.id === bet.creator.teamPickId ? match.homeTeam : match.awayTeam
  const opponentTeam = match.homeTeam.id === bet.opponent.teamPickId ? match.homeTeam : match.awayTeam
  const loserName =
    bet.loserId === 'creator' ? bet.creator.name : bet.loserId === 'opponent' ? bet.opponent.name : null
  const winnerName =
    bet.loserId === 'creator' ? bet.opponent.name : bet.loserId === 'opponent' ? bet.creator.name : null

  function handleResolve() {
    if (!id) return
    const home = parseInt(homeScore)
    const away = parseInt(awayScore)
    if (isNaN(home) || isNaN(away)) return

    let winnerId: string
    if (winnerOverride === 'draw') {
      winnerId = 'draw'
    } else if (winnerOverride === 'score') {
      winnerId = home > away ? match!.homeTeam.id : away > home ? match!.awayTeam.id : 'draw'
    } else {
      winnerId = winnerOverride
    }

    resolveBet(id, { winnerId, homeScore: home, awayScore: away })
    setShowModal(false)
  }

  function handleAcknowledge() {
    if (id) acknowledgePunishment(id)
  }

  // Full-screen punishment reveal
  if (bet.status === 'punishment_pending' && bet.loserId && bet.loserId !== 'draw') {
    return <PunishmentBanner bet={bet} onDone={handleAcknowledge} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Match header */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SportIcon sport={match.sport} />
            <span className="text-slate-400 text-sm capitalize">{match.sport}</span>
          </div>
          <Badge status={bet.status} />
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-4xl mb-1">{match.homeTeam.emoji}</div>
            <div className="font-bold text-white">{match.homeTeam.name}</div>
            <div className="text-xs text-slate-500">{match.homeTeam.shortCode}</div>
          </div>

          <div className="text-center px-4">
            {match.result ? (
              <div className="text-3xl font-black text-white">
                {match.result.homeScore} – {match.result.awayScore}
              </div>
            ) : (
              <div className="text-slate-500 font-bold text-lg">VS</div>
            )}
            <div className="text-xs text-slate-500 mt-1">
              {new Date(match.scheduledAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-1">{match.awayTeam.emoji}</div>
            <div className="font-bold text-white">{match.awayTeam.name}</div>
            <div className="text-xs text-slate-500">{match.awayTeam.shortCode}</div>
          </div>
        </div>

        {/* Picks */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { participant: bet.creator, team: creatorTeam },
            { participant: bet.opponent, team: opponentTeam },
          ].map(({ participant, team }) => {
            const isLoser = loserName === participant.name
            const isWinner = winnerName === participant.name
            return (
              <div
                key={participant.name}
                className={`bg-slate-900/60 border rounded-xl p-3 ${
                  isLoser
                    ? 'border-red-500/40'
                    : isWinner
                      ? 'border-emerald-500/40'
                      : 'border-slate-700'
                }`}
              >
                <div className="text-xs text-slate-500 mb-1">{participant.name}</div>
                <div className="flex items-center gap-1.5">
                  <span>{team.emoji}</span>
                  <span className="font-semibold text-white text-sm">{team.name}</span>
                </div>
                {isWinner && <div className="text-xs text-emerald-400 mt-1">🎉 Won!</div>}
                {isLoser && <div className="text-xs text-red-400 mt-1">😬 Lost</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Punishment */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{punishment.emoji}</span>
          <h3 className="font-bold text-white">Punishment</h3>
        </div>
        <p className="text-amber-400 font-bold text-lg">
          {formatPunishment(punishment, bet.punishment.reps)}
        </p>
        {loserName && (
          <p className="text-sm text-slate-400 mt-1">
            {bet.status === 'completed'
              ? `${loserName} completed this.`
              : `${loserName} must complete this.`}
          </p>
        )}
        {bet.loserId === 'draw' && (
          <p className="text-sm text-slate-400 mt-1">It was a draw — no punishment!</p>
        )}
      </div>

      {/* Action */}
      {bet.status === 'active' && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors"
        >
          Enter Match Result
        </button>
      )}

      {bet.status === 'completed' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <span>✅</span>
            <span>Bet settled</span>
          </div>
          <span className="text-slate-400 text-xs">
            {bet.resolvedAt
              ? new Date(bet.resolvedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        </div>
      )}

      {/* Result modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-4">Enter Final Score</h3>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 text-center">
                <div className="text-sm text-slate-400 mb-1.5">{match.homeTeam.name}</div>
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-center text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
              <span className="text-slate-500 font-bold pt-5">–</span>
              <div className="flex-1 text-center">
                <div className="text-sm text-slate-400 mb-1.5">{match.awayTeam.name}</div>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-center text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Manual override for draws or unusual cases */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block">Winner (override if needed)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'score', label: 'From Score' },
                  { value: match.homeTeam.id, label: match.homeTeam.shortCode },
                  { value: match.awayTeam.id, label: match.awayTeam.shortCode },
                  { value: 'draw', label: 'Draw' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWinnerOverride(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      winnerOverride === opt.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={homeScore === '' || awayScore === ''}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Confirm Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
