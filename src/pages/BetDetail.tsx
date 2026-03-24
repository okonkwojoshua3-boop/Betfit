import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { getMatchById } from '../data/matches'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import { useProof } from '../hooks/useProof'
import PunishmentBanner from '../components/bets/PunishmentBanner'
import Badge from '../components/ui/Badge'
import SportIcon from '../components/ui/SportIcon'
import type { Match } from '../types'

// ── Match status helper ───────────────────────────────────────────────────────
function MatchStatusBadge({ match }: { match: Match }) {
  if (match.status === 'live') {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-400">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
        LIVE
      </span>
    )
  }
  if (match.result || match.status === 'finished') {
    return <span className="text-xs font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">FT</span>
  }
  const kickoff = new Date(match.scheduledAt)
  const now = new Date()
  if (kickoff > now) {
    return (
      <span className="text-xs text-slate-500">
        {kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
        {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    )
  }
  return <span className="text-xs text-slate-500 italic">Awaiting result</span>
}

// ── Proof section ─────────────────────────────────────────────────────────────
function ProofSection({
  betId,
  loserName,
  winnerName,
  punishmentText,
  onApproved,
}: {
  betId: string
  loserName: string
  winnerName: string
  punishmentText: string
  onApproved: () => void
}) {
  const { proof, uploading, uploadProof, approveProof, rejectProof, clearProof } = useProof(betId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadProof(file)
  }

  function handleApprove() {
    approveProof()
    onApproved()
  }

  function handleReject() {
    if (!rejectNote.trim()) return
    rejectProof(rejectNote.trim())
    setShowRejectInput(false)
    setRejectNote('')
  }

  // No proof yet — show upload
  if (!proof || !proof.fileUrl) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📸</span>
          <h3 className="font-bold text-white">Upload Proof</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          <span className="text-amber-400 font-semibold">{loserName}</span> — take a photo showing you completed{' '}
          <span className="text-white font-semibold">{punishmentText}</span>.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? 'Uploading…' : '📷 Choose / Take Photo'}
        </button>
        <p className="text-xs text-slate-600 text-center mt-2">Photos only · Stored securely in the cloud.</p>
      </div>
    )
  }

  // Proof rejected — show rejection + re-upload
  if (proof.status === 'rejected') {
    return (
      <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">❌</span>
          <h3 className="font-bold text-red-400">Proof Rejected</h3>
        </div>
        {proof.rejectionNote && (
          <p className="text-sm text-slate-300 bg-slate-900 rounded-xl px-4 py-3 mb-4 border border-slate-700">
            "{proof.rejectionNote}"
          </p>
        )}
        <img
          src={proof.fileUrl}
          alt="Rejected proof"
          className="w-full rounded-xl mb-4 opacity-40 grayscale"
        />
        <p className="text-sm text-slate-400 mb-3">
          {winnerName} rejected this. Try again, {loserName}.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            clearProof()
            handleFileChange(e)
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors"
        >
          📷 Re-upload Proof
        </button>
      </div>
    )
  }

  // Proof pending review — show photo + approve/reject
  return (
    <div className="bg-slate-800 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔍</span>
        <h3 className="font-bold text-white">Review Proof</h3>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full ml-auto">
          Awaiting approval
        </span>
      </div>

      <img
        src={proof.fileUrl}
        alt="Punishment proof"
        className="w-full rounded-xl mb-3 object-cover max-h-72"
      />

      <p className="text-xs text-slate-500 mb-4">
        Uploaded {new Date(proof.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>

      {!showRejectInput ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-xl transition-colors border border-slate-600"
          >
            ❌ Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReject()}
            placeholder="Reason for rejection..."
            autoFocus
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowRejectInput(false); setRejectNote('') }}
              className="flex-1 bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectNote.trim()}
              className="flex-1 bg-red-500 hover:bg-red-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main BetDetail page ───────────────────────────────────────────────────────
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
  const [winnerOverride, setWinnerOverride] = useState<string>('score')

  // Controls whether PunishmentBanner is showing (true on first visit when punishment_pending)
  const [showBanner, setShowBanner] = useState(true)

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

  // Show dramatic punishment reveal banner (first visit only)
  if (bet.status === 'punishment_pending' && bet.loserId && bet.loserId !== 'draw' && showBanner) {
    return <PunishmentBanner bet={bet} onDone={() => setShowBanner(false)} />
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
          <div className="flex items-center gap-2">
            <MatchStatusBadge match={match} />
            <Badge status={bet.status} />
          </div>
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

      {/* Proof upload / review section */}
      {bet.status === 'punishment_pending' && loserName && winnerName && (
        <div className="mb-4">
          <ProofSection
            betId={bet.id}
            loserName={loserName}
            winnerName={winnerName}
            punishmentText={formatPunishment(punishment, bet.punishment.reps)}
            onApproved={() => acknowledgePunishment(bet.id)}
          />
        </div>
      )}

      {/* Enter result (active bets) */}
      {bet.status === 'active' && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors"
        >
          Enter Match Result
        </button>
      )}

      {/* Completed state */}
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

      {/* Result entry modal */}
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
