import type { Bet, Match, MatchResult } from '../types'

/** Legacy 1v1 resolver — kept for backwards compat */
export function resolveWinner(
  bet: Bet,
  result: MatchResult,
): 'creator' | 'opponent' | 'draw' {
  const { winnerId } = result
  if (winnerId === 'draw') return 'draw'
  const creatorWon = bet.creator.teamPickId === winnerId
  const opponentWon = bet.opponent.teamPickId === winnerId
  if (creatorWon && !opponentWon) return 'opponent'
  if (opponentWon && !creatorWon) return 'creator'
  return 'draw'
}

/**
 * Given a match result, returns the ID of the team that lost.
 * Returns 'draw' when the result is a draw.
 */
export function resolveLosingTeam(match: Match, result: MatchResult): string {
  const { winnerId } = result
  if (winnerId === 'draw') return 'draw'
  if (winnerId === match.homeTeam.id) return match.awayTeam.id
  if (winnerId === match.awayTeam.id) return match.homeTeam.id
  return 'draw'
}
