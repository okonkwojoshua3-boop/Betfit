import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import { getMatchById } from '../data/matches'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import { useProof } from '../hooks/useProof'
import { useLiveScore } from '../hooks/useLiveScore'
import { createNotification } from '../services/notificationService'
import PunishmentBanner from '../components/bets/PunishmentBanner'
import Badge from '../components/ui/Badge'
import SportIcon from '../components/ui/SportIcon'
import type { Bet, Match } from '../types'
import type { LiveMatchData } from '../lib/sportsApi'
import TeamLogo from '../components/ui/TeamLogo'

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv|m4v|ogv)(\?|$)/i.test(url)
}

function ProofMedia({ url, alt }: { url: string; alt: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        className="w-full rounded-xl mb-3 object-cover max-h-72"
      />
    )
  }
  return <img src={url} alt={alt} className="w-full rounded-xl mb-3 object-cover max-h-72" />
}

/** Build a synthetic Match from stored bet fields when localStorage doesn't have it (e.g. opponent's device). */
function matchFromBet(bet: Bet): Match | undefined {
  if (!bet.homeTeamId || !bet.awayTeamId) return undefined
  return {
    id: bet.matchId,
    sport: bet.sport ?? 'football',
    homeTeam: {
      id: bet.homeTeamId,
      name: bet.homeTeamName ?? 'Home',
      shortCode: (bet.homeTeamName ?? 'HOM').slice(0, 3).toUpperCase(),
      badgeColor: '',
      emoji: bet.homeTeamEmoji ?? '🏠',
    },
    awayTeam: {
      id: bet.awayTeamId,
      name: bet.awayTeamName ?? 'Away',
      shortCode: (bet.awayTeamName ?? 'AWY').slice(0, 3).toUpperCase(),
      badgeColor: '',
      emoji: bet.awayTeamEmoji ?? '✈️',
    },
    scheduledAt: bet.matchScheduledAt ?? bet.createdAt,
    status: 'upcoming',
  }
}

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
}: {
  betId: string
  loserName: string
  punishmentText: string
}) {
  const { proof, uploading, uploadError, uploadProof, clearProof } = useProof(betId)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadProof(file)
    // reset input so the same file can be re-selected after a failure
    e.target.value = ''
  }

  if (!proof || !proof.fileUrl) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📸</span>
          <h3 className="font-bold text-white">Upload Proof</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          <span className="text-amber-400 font-semibold">{loserName}</span> — take a photo or video showing you completed{' '}
          <span className="text-white font-semibold">{punishmentText}</span>.
        </p>
        {uploadError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{uploadError}</p>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? 'Uploading…' : '📷 Choose Photo or Video'}
        </button>
        <p className="text-xs text-slate-600 text-center mt-2">Photo or video · max 50MB</p>
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
        <div className="opacity-40 grayscale mb-4"><ProofMedia url={proof.fileUrl} alt="Rejected proof" /></div>
        {uploadError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{uploadError}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { clearProof(); handleFileChange(e) }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-3 rounded-xl transition-colors"
        >
          {uploading ? 'Uploading…' : '📷 Re-upload Proof'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📤</span>
        <h3 className="font-bold text-white">Proof Submitted</h3>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full ml-auto">
          Awaiting approval
        </span>
      </div>
      <ProofMedia url={proof.fileUrl} alt="Punishment proof" />
      <p className="text-xs text-slate-500">
        Uploaded {new Date(proof.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-xs text-slate-600 mt-2 text-center">Waiting for your opponent to review this.</p>
    </div>
  )
}

// ── Winner proof review ────────────────────────────────────────────────────────
function WinnerProofReview({
  betId,
  loserNames,
  loserUserIds,
  punishmentText,
  onApproved,
}: {
  betId: string
  loserNames: string
  loserUserIds: string[]
  punishmentText: string
  onApproved: () => void
}) {
  const { proof, approveProof, rejectProof } = useProof(betId)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  function handleApprove() {
    approveProof()
    onApproved()
  }

  async function handleReject() {
    if (!rejectNote.trim()) return
    await rejectProof(rejectNote.trim())
    // Notify each loser that their proof was rejected
    for (const uid of loserUserIds) {
      createNotification(
        uid,
        betId,
        `Your proof was rejected: "${rejectNote.trim()}". Please re-upload.`,
        loserNames,
        punishmentText,
      ).catch(console.error)
    }
    setShowRejectInput(false)
    setRejectNote('')
  }

  if (!proof?.fileUrl) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⏳</span>
          <h3 className="font-bold text-white">Awaiting Proof</h3>
        </div>
        <p className="text-sm text-slate-400">
          Waiting for <span className="text-red-400 font-semibold">{loserNames}</span> to upload their proof.
        </p>
      </div>
    )
  }

  if (proof.status === 'approved') {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(34,214,114,0.05)', border: '1px solid rgba(34,214,114,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <h3 className="font-bold text-neon-green">Proof Approved</h3>
        </div>
        <p className="text-sm text-slate-400 mt-1">{loserNames} completed their punishment.</p>
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
      <ProofMedia url={proof.fileUrl} alt="Punishment proof" />
      <p className="text-xs text-slate-500 mb-4">
        Uploaded{' '}
        {new Date(proof.uploadedAt).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
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
  const { profile } = useAuth()

  const bet = id ? getBetById(id) : undefined
  const match = bet ? (getMatchById(bet.matchId) ?? matchFromBet(bet)) : undefined
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

  // Only show scores when the match is actually in progress or finished —
  // ESPN returns homeScore:0/awayScore:0 for scheduled matches too, which we must ignore.
  // Also, only trust bet.homeScore/awayScore once the bet is settled (DB may default to 0).
  const matchIsActive = liveData?.isLive || liveData?.isHalfTime || liveData?.isFinished
  const displayHomeScore = matchIsActive
    ? (liveData!.homeScore ?? null)
    : betResolved
      ? (bet.homeScore ?? null)
      : null
  const displayAwayScore = matchIsActive
    ? (liveData!.awayScore ?? null)
    : betResolved
      ? (bet.awayScore ?? null)
      : null

  // Show punishment banner on first visit when resolved
  if (bet.status === 'punishment_pending' && currentUserIsLoser && showBanner) {
    return <PunishmentBanner bet={bet} match={match} punishmentText={punishmentText} onDone={() => setShowBanner(false)} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
        ← Back
      </button>

      {/* Match header — broadcast style */}
      <div
        className="relative overflow-hidden rounded-3xl mb-4 animate-fade-up animate-fill-both"
        style={{
          background: 'linear-gradient(160deg, #111D30 0%, #0D1525 100%)',
          border: liveData?.isLive ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)',
          boxShadow: liveData?.isLive ? '0 0 40px rgba(239,68,68,0.1)' : '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: liveData?.isLive ? 'linear-gradient(90deg,transparent,rgba(239,68,68,0.7),transparent)' : 'linear-gradient(90deg,transparent,rgba(34,214,114,0.4),transparent)' }} />

        <div className="p-4 sm:p-6">
          {/* Status row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                <SportIcon sport={match.sport} />
              </div>
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">{match.sport}</span>
            </div>
            <div className="flex items-center gap-2">
              <MatchStatusBadge match={match} liveData={liveData} />
              <Badge status={bet.status} />
            </div>
          </div>

          {/* Score — broadcast graphic */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamLogo name={match.homeTeam.name} logo={match.homeTeam.logo ?? bet.homeTeamLogo} teamId={match.homeTeam.id} sport={match.sport} emoji={match.homeTeam.emoji} size="xl" />
              <span className="font-display font-bold text-white text-center leading-tight text-sm sm:text-base">{match.homeTeam.name}</span>
              <span className="text-[11px] text-slate-600 font-medium tracking-widest uppercase">{match.homeTeam.shortCode}</span>
            </div>

            <div className="flex-shrink-0 mx-2 sm:mx-4 text-center min-w-[90px] sm:min-w-[120px]">
              {/* Status badge — above the score */}
              {matchIsActive && liveData?.statusText ? (
                <div className="mb-2 flex justify-center">
                  {liveData.isHalfTime ? (
                    <span className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full tracking-wide">
                      HT
                    </span>
                  ) : liveData.isLive ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-3 py-1 rounded-full tracking-wide">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shrink-0" />
                      {liveData.statusText}
                    </span>
                  ) : liveData.isFinished ? (
                    <span className="text-sm font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full tracking-wide">
                      FT
                    </span>
                  ) : null}
                </div>
              ) : displayHomeScore == null && match.scheduledAt ? (
                /* Kickoff time when match hasn't started */
                <div className="mb-2 text-xs text-slate-500 font-medium">
                  {new Date(match.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : null}

              {/* Score */}
              {displayHomeScore != null && displayAwayScore != null ? (
                <div
                  className="font-score leading-none tracking-wider px-4 py-2 rounded-2xl"
                  style={{
                    fontSize: 'clamp(36px, 10vw, 52px)',
                    color: liveData?.isLive && !liveData.isHalfTime ? '#F87171' : '#F0F4FF',
                    background: liveData?.isLive && !liveData.isHalfTime ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                    border: liveData?.isLive && !liveData.isHalfTime ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {displayHomeScore} – {displayAwayScore}
                </div>
              ) : (
                <div className="font-score text-3xl text-slate-600 tracking-widest px-4">VS</div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamLogo name={match.awayTeam.name} logo={match.awayTeam.logo ?? bet.awayTeamLogo} teamId={match.awayTeam.id} sport={match.sport} emoji={match.awayTeam.emoji} size="xl" />
              <span className="font-display font-bold text-white text-center leading-tight text-sm sm:text-base">{match.awayTeam.name}</span>
              <span className="text-[11px] text-slate-600 font-medium tracking-widest uppercase">{match.awayTeam.shortCode}</span>
            </div>
          </div>

          {/* Participants */}
          {participants.length > 0 ? (
            <div>
              <div className="h-px bg-white/5 mb-4" />
              <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-3">
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
                      className="rounded-xl p-3 transition-colors"
                      style={{
                        background: isLoser ? 'rgba(239,68,68,0.06)' : isWinner ? 'rgba(34,214,114,0.06)' : 'rgba(255,255,255,0.03)',
                        border: isLoser ? '1px solid rgba(239,68,68,0.2)' : isWinner ? '1px solid rgba(34,214,114,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-[11px] text-slate-500 mb-1 truncate">{p.username}</div>
                      <div className="flex items-center gap-1.5">
                        <span>{team.emoji}</span>
                        <span className="font-semibold text-white text-sm truncate">{team.name}</span>
                      </div>
                      {isWinner && <div className="text-[11px] text-neon-green mt-1.5 font-semibold">🎉 Won!</div>}
                      {isLoser && <div className="text-[11px] text-red-400 mt-1.5 font-semibold">😬 Lost</div>}
                      {isDraw && losingTeamId && <div className="text-[11px] text-slate-500 mt-1.5">Draw</div>}
                    </div>
                  )
                })}
              </div>
              {bet.status === 'pending' && (
                <p className="text-[11px] text-slate-600 mt-3 text-center">
                  Waiting for more players to join via the invite link
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-center pt-2">No participants yet</p>
          )}
        </div>
      </div>

      {/* Punishment */}
      <div
        className="rounded-2xl p-5 mb-4 animate-fade-up animate-fill-both animate-delay-100"
        style={{ background: 'linear-gradient(160deg, #1A1505, #110E03)', border: '1px solid rgba(245,158,11,0.15)' }}
      >
        <div className="absolute-top-0" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{punishment.emoji}</span>
          <h3 className="font-display font-bold text-white">Punishment</h3>
        </div>
        <p className="text-2xl font-display font-bold gradient-text-amber">{punishmentText}</p>
        {isDraw && <p className="text-sm text-slate-500 mt-2">It was a draw — no punishment!</p>}
        {losers.length > 0 && bet.status !== 'completed' && (
          <p className="text-sm text-slate-500 mt-2">
            <span className="text-red-400 font-semibold">{loserNames}</span> must complete this.
          </p>
        )}
        {losers.length > 0 && bet.status === 'completed' && (
          <p className="text-sm text-slate-500 mt-2">
            <span className="text-slate-300 font-semibold">{loserNames}</span> completed this.
          </p>
        )}
        {winners.length > 0 && (
          <p className="text-sm text-neon-green mt-2 font-semibold">
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
          />
        </div>
      )}

      {/* Proof review for winners */}
      {bet.status === 'punishment_pending' && !currentUserIsLoser && !isDraw && (
        <div className="mb-4">
          <WinnerProofReview
            betId={bet.id}
            loserNames={loserNames}
            loserUserIds={losers.map((p) => p.userId)}
            punishmentText={punishmentText}
            onApproved={() => acknowledgePunishment(bet.id)}
          />
        </div>
      )}

      {/* Waiting for result */}
      {bet.status === 'active' && !liveData?.isLive && !liveData?.isFinished && (
        <div
          className="rounded-xl px-4 py-3 text-center text-sm text-slate-600 animate-fade-up animate-fill-both animate-delay-200"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {new Date(match.scheduledAt) < new Date()
            ? 'Checking for match result...'
            : 'Scores update automatically every 45s once the match starts'}
        </div>
      )}

      {/* Completed */}
      {bet.status === 'completed' && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between animate-fade-up animate-fill-both animate-delay-200"
          style={{ background: 'rgba(34,214,114,0.06)', border: '1px solid rgba(34,214,114,0.15)' }}
        >
          <div className="flex items-center gap-2 text-neon-green font-semibold text-sm">
            <span>✅</span>
            <span>Bet settled</span>
          </div>
          <span className="text-slate-500 text-xs">
            {bet.resolvedAt
              ? new Date(bet.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
        </div>
      )}

    </div>
  )
}
