import type { Bet } from '../types'

export interface PlayerStats {
  wins: number
  losses: number
  draws: number
  winRate: number
  punishmentsPending: number
  punishmentsCompleted: number
  totalBets: number
}

export function getPlayerStats(playerName: string, bets: Bet[]): PlayerStats {
  // Only count bets that have been resolved (not pending/active)
  const resolved = bets.filter(
    (b) =>
      (b.creator.name === playerName || b.opponent.name === playerName) &&
      (b.status === 'punishment_pending' || b.status === 'completed') &&
      b.loserId !== undefined,
  )

  let wins = 0
  let losses = 0
  let draws = 0
  let punishmentsPending = 0
  let punishmentsCompleted = 0

  for (const bet of resolved) {
    const isCreator = bet.creator.name === playerName
    const loserId = bet.loserId

    if (loserId === 'draw') {
      draws++
    } else if (
      (isCreator && loserId === 'creator') ||
      (!isCreator && loserId === 'opponent')
    ) {
      losses++
      if (bet.status === 'punishment_pending') punishmentsPending++
      if (bet.status === 'completed') punishmentsCompleted++
    } else {
      wins++
    }
  }

  const settledBets = wins + losses + draws
  const winRate = settledBets > 0 ? Math.round((wins / settledBets) * 100) : 0

  // Count all non-pending bets for totalBets
  const totalBets = bets.filter(
    (b) =>
      (b.creator.name === playerName || b.opponent.name === playerName) &&
      b.status !== 'pending',
  ).length

  return { wins, losses, draws, winRate, punishmentsPending, punishmentsCompleted, totalBets }
}
