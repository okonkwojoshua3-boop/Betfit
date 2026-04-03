import { useState, useEffect, useCallback } from 'react'
import type { Bet, Match, MatchResult } from '../types'
import { resolveLosingTeam } from '../lib/betEngine'
import { supabase } from '../lib/supabase'
import { getPunishmentById, formatPunishment } from '../data/punishments'
import { createNotification } from '../services/notificationService'
import {
  fetchBets,
  createBet as dbCreateBet,
  acceptBet as dbAcceptBet,
  declineBet as dbDeclineBet,
  resolveBet as dbResolveBet,
  completeBet as dbCompleteBet,
  requestCancelBet as dbRequestCancel,
  approveCancelBet as dbApproveCancel,
  declineCancelBet as dbDeclineCancel,
} from '../services/betService'

export function useBetStore(userId: string | undefined) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

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

    const refresh = () => fetchBets(userId).then(setBets).catch(console.error)

    // Real-time: listen for changes to bets the user created or participates in
    const channel = supabase
      .channel(`bets:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets', filter: `creator_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bet_participants', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bet_participants' }, refresh)
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
    setBets((prev) => prev.map((b) => (b.id === betId ? { ...b, status: 'active' } : b)))
  }, [])

  const declineBet = useCallback(async (betId: string) => {
    await dbDeclineBet(betId)
    setBets((prev) => prev.filter((b) => b.id !== betId))
  }, [])

  const resolveBet = useCallback(async (betId: string, result: MatchResult, match: Match) => {
    const losingTeamId = resolveLosingTeam(match, result)
    await dbResolveBet(betId, result, losingTeamId)

    // Notify all participants about the outcome
    const bet = bets.find((b) => b.id === betId)
    if (bet?.participants?.length && losingTeamId !== 'draw') {
      const punishment = getPunishmentById(bet.punishment.punishmentId)
      const punishmentText = punishment
        ? formatPunishment(punishment, bet.punishment.reps)
        : `${bet.punishment.reps} reps`
      for (const p of bet.participants) {
        const isLoser = p.teamPickId === losingTeamId
        createNotification(
          p.userId,
          betId,
          isLoser
            ? `😬 You lost! Complete ${punishmentText} and upload your proof.`
            : `🎉 You won! Waiting for the losers to submit proof.`,
          isLoser ? p.username : '',
          isLoser ? punishmentText : '',
        ).catch(console.error)
      }
    }

    setBets((prev) =>
      prev.map((b) =>
        b.id === betId
          ? {
              ...b,
              status: losingTeamId === 'draw' ? 'completed' : 'punishment_pending',
              losingTeamId,
              homeScore: result.homeScore,
              awayScore: result.awayScore,
              resolvedAt: new Date().toISOString(),
            }
          : b,
      ),
    )
  }, [bets])

  const acknowledgePunishment = useCallback(async (betId: string) => {
    await dbCompleteBet(betId)
    setBets((prev) => prev.map((b) => (b.id === betId ? { ...b, status: 'completed' } : b)))
  }, [])

  const requestCancel = useCallback(async (betId: string, otherParticipants: { userId: string; username: string }[]) => {
    await dbRequestCancel(betId)
    setBets((prev) => prev.map((b) => (b.id === betId ? { ...b, status: 'cancel_requested' } : b)))
    for (const p of otherParticipants) {
      createNotification(p.userId, betId, `The bet creator wants to cancel this bet. Open it to approve or decline.`, '', '').catch(console.error)
    }
  }, [])

  const approveCancel = useCallback(async (betId: string, requesterId: string, approverName: string) => {
    await dbApproveCancel(betId)
    setBets((prev) => prev.filter((b) => b.id !== betId))
    createNotification(requesterId, betId, `${approverName} approved the cancellation. The bet has been removed.`, '', '').catch(console.error)
  }, [])

  const declineCancel = useCallback(async (betId: string, requesterId: string, declinerName: string) => {
    await dbDeclineCancel(betId)
    setBets((prev) => prev.map((b) => (b.id === betId ? { ...b, status: 'active' } : b)))
    createNotification(requesterId, betId, `${declinerName} declined the cancellation. The bet is still active.`, '', '').catch(console.error)
  }, [])

  const getActiveBets = useCallback(
    () => bets.filter((b) => b.status === 'active' || b.status === 'punishment_pending' || b.status === 'cancel_requested'),
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
    requestCancel,
    approveCancel,
    declineCancel,
    getActiveBets,
    getPendingBets,
    getCompletedBets,
    getBetById,
  }
}
