import { supabase } from '../lib/supabase'
import type { Bet, MatchResult } from '../types'
import { createNotification } from './notificationService'

// ── DB row → frontend Bet ────────────────────────────────────────────────────
function rowToBet(row: Record<string, unknown>): Bet {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    creatorId: row.creator_id as string,
    opponentId: row.opponent_id as string | undefined,
    creator: {
      name: row.creator_name as string,
      teamPickId: row.creator_team_pick_id as string,
    },
    opponent: {
      name: row.opponent_name as string,
      teamPickId: row.opponent_team_pick_id as string | undefined,
    },
    punishment: {
      punishmentId: row.punishment_id as string,
      reps: row.punishment_reps as number,
    },
    status: row.status as Bet['status'],
    loserId: row.loser_id as Bet['loserId'],
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | undefined,
    inviteToken: row.invite_token as string | undefined,
    homeTeamName: row.home_team_name as string | undefined,
    awayTeamName: row.away_team_name as string | undefined,
    homeTeamEmoji: row.home_team_emoji as string | undefined,
    awayTeamEmoji: row.away_team_emoji as string | undefined,
  }
}

export async function fetchBets(userId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToBet)
}

export async function createBet(bet: Omit<Bet, 'id' | 'createdAt'>): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .insert({
      match_id: bet.matchId,
      creator_id: bet.creatorId,
      opponent_id: bet.opponentId ?? null,
      creator_name: bet.creator.name,
      opponent_name: bet.opponent.name ?? '',
      creator_team_pick_id: bet.creator.teamPickId,
      opponent_team_pick_id: bet.opponent.teamPickId ?? null,
      punishment_id: bet.punishment.punishmentId,
      punishment_reps: bet.punishment.reps,
      status: 'pending',
      home_team_name: bet.homeTeamName ?? null,
      away_team_name: bet.awayTeamName ?? null,
      home_team_emoji: bet.homeTeamEmoji ?? null,
      away_team_emoji: bet.awayTeamEmoji ?? null,
    })
    .select()
    .single()

  if (error) throw error
  const created = rowToBet(data)

  // Notify opponent they received a bet invite
  if (bet.opponentId) {
    createNotification(
      bet.opponentId,
      created.id,
      `${bet.creator.name} challenged you to a bet!`,
      '',
      '',
    ).catch(console.error)
  }

  return created
}

export async function acceptBet(betId: string): Promise<void> {
  const { error } = await supabase
    .from('bets')
    .update({ status: 'active' })
    .eq('id', betId)

  if (error) throw error
}

export async function declineBet(betId: string): Promise<void> {
  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw error
}

export async function resolveBet(betId: string, result: MatchResult, loserId: string): Promise<void> {
  const { error } = await supabase
    .from('bets')
    .update({
      status: loserId === 'draw' ? 'completed' : 'punishment_pending',
      loser_id: loserId,
      home_score: result.homeScore,
      away_score: result.awayScore,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', betId)

  if (error) throw error
}

export async function completeBet(betId: string): Promise<void> {
  const { error } = await supabase
    .from('bets')
    .update({ status: 'completed' })
    .eq('id', betId)

  if (error) throw error
}

export async function fetchBetByToken(token: string): Promise<Bet | null> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle()

  if (error || !data) return null
  return rowToBet(data)
}

export async function acceptInvite(
  token: string,
  opponentId: string,
  opponentName: string,
  opponentTeamPickId: string,
): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .update({
      opponent_id: opponentId,
      opponent_name: opponentName,
      opponent_team_pick_id: opponentTeamPickId,
      status: 'active',
    })
    .eq('invite_token', token)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) throw error
  return rowToBet(data)
}
