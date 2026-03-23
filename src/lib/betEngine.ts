import type { Bet, MatchResult } from '../types'

export function resolveWinner(
  bet: Bet,
  result: MatchResult,
): 'creator' | 'opponent' | 'draw' {
  const { winnerId } = result

  if (winnerId === 'draw') return 'draw'

  const creatorWon = bet.creator.teamPickId === winnerId
  const opponentWon = bet.opponent.teamPickId === winnerId

  if (creatorWon && !opponentWon) return 'opponent' // creator wins → opponent loses
  if (opponentWon && !creatorWon) return 'creator'  // opponent wins → creator loses
  return 'draw' // both picked the same team or neither picked the winner
}
