import { useState, useCallback } from 'react'
import type { Bet, MatchResult } from '../types'
import { resolveWinner } from '../lib/betEngine'

const STORAGE_KEY = 'betfit_bets_v1'

function loadBets(): Bet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Bet[]) : []
  } catch {
    return []
  }
}

function saveBets(bets: Bet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets))
}

export function useBetStore() {
  const [bets, setBets] = useState<Bet[]>(loadBets)

  const mutate = useCallback((updater: (prev: Bet[]) => Bet[]) => {
    setBets((prev) => {
      const next = updater(prev)
      saveBets(next)
      return next
    })
  }, [])

  const addBet = useCallback(
    (bet: Bet) => mutate((prev) => [bet, ...prev]),
    [mutate],
  )

  const resolveBet = useCallback(
    (betId: string, result: MatchResult) => {
      mutate((prev) =>
        prev.map((bet) => {
          if (bet.id !== betId) return bet
          const loserId = resolveWinner(bet, result)
          return {
            ...bet,
            status: loserId === 'draw' ? 'completed' : 'punishment_pending',
            loserId,
            resolvedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [mutate],
  )

  const acknowledgePunishment = useCallback(
    (betId: string) => {
      mutate((prev) =>
        prev.map((bet) =>
          bet.id === betId ? { ...bet, status: 'completed' } : bet,
        ),
      )
    },
    [mutate],
  )

  const getActiveBets = useCallback(
    () => bets.filter((b) => b.status === 'active' || b.status === 'punishment_pending'),
    [bets],
  )

  const getCompletedBets = useCallback(
    () => bets.filter((b) => b.status === 'completed'),
    [bets],
  )

  const getBetById = useCallback(
    (id: string) => bets.find((b) => b.id === id),
    [bets],
  )

  return {
    bets,
    addBet,
    resolveBet,
    acknowledgePunishment,
    getActiveBets,
    getCompletedBets,
    getBetById,
  }
}
