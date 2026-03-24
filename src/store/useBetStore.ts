import { useState, useEffect, useCallback } from 'react'
import type { Bet, MatchResult } from '../types'
import { resolveWinner } from '../lib/betEngine'
import { supabase } from '../lib/supabase'
import {
  fetchBets,
  createBet as dbCreateBet,
  acceptBet as dbAcceptBet,
  declineBet as dbDeclineBet,
  resolveBet as dbResolveBet,
  completeBet as dbCompleteBet,
} from '../services/betService'

export function useBetStore(userId: string | undefined) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  // Load bets from Supabase on mount / user change
  useEffect(() => {
    if (!userId) {
      setBets([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchBets(userId)
      .then(setBets)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Real-time: update local state whenever bets change in DB
    const channel = supabase
      .channel(`bets:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `creator_id=eq.${userId}`,
        },
        () => fetchBets(userId).then(setBets).catch(console.error),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `opponent_id=eq.${userId}`,
        },
        () => fetchBets(userId).then(setBets).catch(console.error),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const addBet = useCallback(async (bet: Omit<Bet, 'id' | 'createdAt'>): Promise<Bet> => {
    const created = await dbCreateBet(bet)
    setBets((prev) => [created, ...prev])
    return created
  }, [])

  const acceptBet = useCallback(async (betId: string) => {
    await dbAcceptBet(betId)
    setBets((prev) =>
      prev.map((b) => (b.id === betId ? { ...b, status: 'active' } : b)),
    )
  }, [])

  const declineBet = useCallback(async (betId: string) => {
    await dbDeclineBet(betId)
    setBets((prev) => prev.filter((b) => b.id !== betId))
  }, [])

  const resolveBet = useCallback(async (betId: string, result: MatchResult) => {
    const bet = bets.find((b) => b.id === betId)
    if (!bet) return
    const loserId = resolveWinner(bet, result)
    await dbResolveBet(betId, result, loserId)
    setBets((prev) =>
      prev.map((b) =>
        b.id === betId
          ? {
              ...b,
              status: loserId === 'draw' ? 'completed' : 'punishment_pending',
              loserId,
              resolvedAt: new Date().toISOString(),
            }
          : b,
      ),
    )
  }, [bets])

  const acknowledgePunishment = useCallback(async (betId: string) => {
    await dbCompleteBet(betId)
    setBets((prev) =>
      prev.map((b) => (b.id === betId ? { ...b, status: 'completed' } : b)),
    )
  }, [])

  const getActiveBets = useCallback(
    () => bets.filter((b) => b.status === 'active' || b.status === 'punishment_pending'),
    [bets],
  )

  const getPendingBets = useCallback(
    () => bets.filter((b) => b.status === 'pending'),
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
    loading,
    addBet,
    acceptBet,
    declineBet,
    resolveBet,
    acknowledgePunishment,
    getActiveBets,
    getPendingBets,
    getCompletedBets,
    getBetById,
  }
}
