import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import { getMatchById } from '../data/matches'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import { useProof } from '../hooks/useProof'
import { useLiveScore } from '../hooks/useLiveScore'
import PunishmentBanner from '../components/bets/PunishmentBanner'
import Badge from '../components/ui/Badge'
import SportIcon from '../components/ui/SportIcon'
import type { Match } from '../types'
import type { LiveMatchData } from '../lib/sportsApi'

// ── Match status helper ───────────────────────────────────────────────────────
function MatchStatusBadge({ match, liveData }: { match: Match; liveData: LiveMatchData | null }) {
  if (liveData?.isLive) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-400">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
        {liveData.statusText}
      </span>
    )
  }
  if (liveData?.isFinished || match.result || match.status === 'finished') {
    return <span className="text-xs font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">FT</span>
  }
  if (match.status === 'live') {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-400">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
        LIVE
      </span>
    )
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
  punishmentText,
  onApproved,
}: {
  betId: string
  loserName: string
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
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? 'Uploading…' : '📷 Choose / Take Photo'}
        </button>
        <p className="text-xs text-slate-600 text-center mt-2">Photos only · Stored securely.</p>
      </div>
    )
  }

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
        <img src={proof.fileUrl} alt="Rejected proof" className="w-full rounded-xl mb-4 opacity-40 grayscale" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { clearProof(); handleFileChange(e) }}
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

  return (
    <div className="bg-slate-800 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔍</span>
        <h3 className="font-bold text-white">Review Proof</h3>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full ml-auto">
          Awaiting approval
        </span>
      </div>
      <img src={proof.fileUrl} alt="Punishment proof" className="w-full rounded-xl mb-3 object-cover max-h-72" />
      <p className="text-xs text-slate-500 mb-4">
        Uploaded {new Date(proof.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>
      {!showRejectInput ? (
        <div className="flex gap-2">
          <button onClick={handleApprove} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors">
            ✅ Approve
          </button>
          <button onClick={() => setShowRejectInput(true)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-xl transition-colors border border-slate-600">
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
            <button onClick={() => { setShowRejectInput(false); setRejectNote('') }} className="flex-1 bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm">
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
  const { profile } = useAuth()

  const bet = id ? getBetById(id) : undefined
  const match = bet ? getMatchById(bet.matchId) : undefined
  const punishment = bet ? getPunishmentById(bet.punishment.punishmentId) : undefined

  const betResolved = bet?.status === 'punishment_pending' || bet?.status === 'completed'
  const liveData = useLiveScore(match, betResolved, (result) => {
    if (id && match) resolveBet(id, result, match)
  })

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

  // ── Group bet derived state ──────────────────────────────────────────────────
  const participants = bet.participants ?? []
  const losingTeamId = bet.losingTeamId
  const isDraw = losingTeamId === 'draw'
  const losers = losingTeamId && !isDraw
    ? participants.filter((p) => p.teamPickId === losingTeamId)
    : []
  const winners = losingTeamId && !isDraw
    ? participants.filter((p) => p.teamPickId !== losingTeamId)
    : []

  const currentUserParticipant = participants.find((p) => p.userId === profile?.id)
  const currentUserIsLoser = !!losingTeamId && !isDraw && currentUserParticipant?.teamPickId === losingTeamId
  const punishmentText = formatPunishment(punishment, bet.punishment.reps)
  const loserNames = losers.map((p) => p.username).join(', ')

  // Resolved score: live data takes priority, then stored bet scores
  const displayHomeScore = liveData?.homeScore ?? bet.homeScore ?? null
  const displayAwayScore = liveData?.awayScore ?? bet.awayScore ?? null

  // Show punishment banner on first visit when resolved
  if (bet.status === 'punishment_pending' && losingTeamId && !isDraw && showBanner) {
    return <PunishmentBanner bet={bet} onDone={() => setShowBanner(false)} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">
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
            <MatchStatusBadge match={match} liveData={liveData} />
            <Badge status={bet.status} />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-1">{match.homeTeam.emoji}</div>
            <div className="font-bold text-white">{match.homeTeam.name}</div>
            <div className="text-xs text-slate-500">{match.homeTeam.shortCode}</div>
          </div>
          <div className="text-center px-4">
            {displayHomeScore != null && displayAwayScore != null ? (
              <div className={`text-3xl font-black ${liveData?.isLive ? 'text-red-400' : 'text-white'}`}>
                {displayHomeScore} – {displayAwayScore}
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

        {/* All participants */}
        {participants.length > 0 ? (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              {participants.length} {participants.length === 1 ? 'player' : 'players'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {participants.map((p) => {
                const team = match.homeTeam.id === p.teamPickId ? match.homeTeam : match.awayTeam
                const isLoser = !isDraw && losingTeamId && p.teamPickId === losingTeamId
                const isWinner = !isDraw && losingTeamId && p.teamPickId !== losingTeamId
                return (
                  <div
                    key={p.userId}
                    className={`bg-slate-900/60 border rounded-xl p-3 ${
                      isLoser ? 'border-red-500/40' : isWinner ? 'border-emerald-500/40' : 'border-slate-700'
                    }`}
                  >
                    <div className="text-xs text-slate-500 mb-1 truncate">{p.username}</div>
                    <div className="flex items-center gap-1.5">
                      <span>{team.emoji}</span>
                      <span className="font-semibold text-white text-sm truncate">{team.name}</span>
                    </div>
                    {isWinner && <div className="text-xs text-emerald-400 mt-1">🎉 Won!</div>}
                    {isLoser && <div className="text-xs text-red-400 mt-1">😬 Lost</div>}
                    {isDraw && losingTeamId && <div className="text-xs text-slate-500 mt-1">Draw</div>}
                  </div>
                )
              })}
            </div>
            {bet.status === 'pending' && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                Waiting for more players to join via the invite link
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center">No participants yet</p>
        )}
      </div>

      {/* Punishment */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{punishment.emoji}</span>
          <h3 className="font-bold text-white">Punishment</h3>
        </div>
        <p className="text-amber-400 font-bold text-lg">{punishmentText}</p>
        {isDraw && <p className="text-sm text-slate-400 mt-1">It was a draw — no punishment!</p>}
        {losers.length > 0 && bet.status !== 'completed' && (
          <p className="text-sm text-slate-400 mt-1">
            {loserNames} must complete this.
          </p>
        )}
        {losers.length > 0 && bet.status === 'completed' && (
          <p className="text-sm text-slate-400 mt-1">
            {loserNames} completed this.
          </p>
        )}
        {winners.length > 0 && (
          <p className="text-sm text-emerald-400 mt-1">
            🎉 {winners.map((p) => p.username).join(', ')} won!
          </p>
        )}
      </div>

      {/* Proof upload — only for current user if they're a loser */}
      {bet.status === 'punishment_pending' && currentUserIsLoser && currentUserParticipant && (
        <div className="mb-4">
          <ProofSection
            betId={bet.id}
            loserName={currentUserParticipant.username}
            punishmentText={punishmentText}
            onApproved={() => acknowledgePunishment(bet.id)}
          />
        </div>
      )}

      {/* Waiting for result */}
      {bet.status === 'active' && !liveData?.isLive && !liveData?.isFinished && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-center text-sm text-slate-500">
          Scores update automatically every 45s once the match starts
        </div>
      )}

      {/* Completed */}
      {bet.status === 'completed' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <span>✅</span>
            <span>Bet settled</span>
          </div>
          <span className="text-slate-400 text-xs">
            {bet.resolvedAt
              ? new Date(bet.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
        </div>
      )}

    </div>
  )
}
