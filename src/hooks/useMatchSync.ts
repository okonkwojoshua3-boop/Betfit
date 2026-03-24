import { useEffect } from 'react'
import { useBets } from '../store/BetContext'
import { useAuth } from '../store/AuthContext'
import { getMatchById } from '../data/matches'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import { fetchMatchResult } from '../services/sportsApi'
import { resolveWinner } from '../lib/betEngine'
import { createNotification } from '../services/notificationService'

const CHECKED_KEY = 'betfit_checked_matches'

function getChecked(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CHECKED_KEY) || '{}')
  } catch {
    return {}
  }
}

function markChecked(matchId: string): void {
  const c = getChecked()
  c[matchId] = Date.now()
  localStorage.setItem(CHECKED_KEY, JSON.stringify(c))
}

function wasRecentlyChecked(matchId: string): boolean {
  const t = getChecked()[matchId]
  if (!t) return false
  return Date.now() - t < 60 * 60 * 1000
}

export function useMatchSync() {
  const { bets, resolveBet } = useBets()
  const { user } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return

    async function sync() {
      const now = new Date()
      const activeBets = bets.filter((b) => b.status === 'active')

      for (const bet of activeBets) {
        const match = getMatchById(bet.matchId)
        if (!match) continue
        if (new Date(match.scheduledAt) > now) continue
        if (wasRecentlyChecked(bet.matchId)) continue
        markChecked(bet.matchId)

        const result = await fetchMatchResult(
          match.homeTeam.id,
          match.awayTeam.id,
          match.awayTeam.name,
          match.scheduledAt,
        )

        if (!result) continue

        await resolveBet(bet.id, result)

        const loserId = resolveWinner(bet, result)
        const punishment = getPunishmentById(bet.punishment.punishmentId)
        if (!punishment) continue

        const loserName =
          loserId === 'creator' ? bet.creator.name
          : loserId === 'opponent' ? bet.opponent.name
          : null

        const punishmentText = formatPunishment(punishment, bet.punishment.reps)

        const message =
          loserId === 'draw'
            ? `${match.homeTeam.name} vs ${match.awayTeam.name} ended in a draw — no punishment!`
            : `${match.homeTeam.name} ${result.homeScore}–${result.awayScore} ${match.awayTeam.name} · ${loserName} lost and must do ${punishmentText}!`

        // Notify both participants
        const notifyIds = [bet.creatorId, bet.opponentId].filter(Boolean) as string[]
        for (const uid of notifyIds) {
          await createNotification(uid, bet.id, message, loserName ?? '', punishmentText)
        }
      }
    }

    sync()
  }, []) // run once on mount
}
