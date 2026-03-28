import { supabase } from '../lib/supabase'
import type { Bet, BetParticipant, MatchResult } from '../types'
import { createNotification } from './notificationService'

// ── Row mappers ───────────────────────────────────────────────────────────────
function rowToBet(row: Record<string, unknown>): Bet {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    creatorId: row.creator_id as string,
    creator: {
      name: row.creator_name as string,
      teamPickId: row.creator_team_pick_id as string,
    },
    opponent: {
      name: (row.opponent_name as string) ?? '',
      teamPickId: row.opponent_team_pick_id as string | undefined,
    },
    punishment: {
      punishmentId: row.punishment_id as string,
      reps: row.punishment_reps as number,
    },
    status: row.status as Bet['status'],
    loserId: row.loser_id as Bet['loserId'],
    losingTeamId: row.losing_team_id as string | undefined,
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | undefined,
    inviteToken: row.invite_token as string | undefined,
    homeTeamName: row.home_team_name as string | undefined,
    awayTeamName: row.away_team_name as string | undefined,
    homeTeamEmoji: row.home_team_emoji as string | undefined,
    awayTeamEmoji: row.away_team_emoji as string | undefined,
  }
}

function rowToParticipant(row: Record<string, unknown>): BetParticipant {
  return {
    id: row.id as string,
    betId: row.bet_id as string,
    userId: row.user_id as string,
    username: row.username as string,
    teamPickId: row.team_pick_id as string,
    joinedAt: row.joined_at as string,
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
export async function fetchBets(userId: string): Promise<Bet[]> {
  // Get bet IDs where user is already a participant
  const { data: participantRows } = await supabase
    .from('bet_participants')
    .select('bet_id')
    .eq('user_id', userId)

  const participantBetIds = (participantRows ?? []).map((r) => r.bet_id as string)

  // Fetch all bets (creator or participant) with nested participants
  let query = supabase
    .from('bets')
    .select('*, bet_participants(*)')
    .order('created_at', { ascending: false })

  if (participantBetIds.length > 0) {
    query = query.or(`creator_id.eq.${userId},id.in.(${participantBetIds.join(',')})`)
  } else {
    query = query.eq('creator_id', userId)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => {
    const bet = rowToBet(row as Record<string, unknown>)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bet.participants = ((row as any).bet_participants ?? []).map(rowToParticipant)
    return bet
  })
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createBet(bet: Omit<Bet, 'id' | 'createdAt'>): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .insert({
      match_id: bet.matchId,
      creator_id: bet.creatorId,
      creator_name: bet.creator.name,
      opponent_name: '',
      creator_team_pick_id: bet.creator.teamPickId ?? '',
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

  // Insert creator as first participant
  if (bet.creatorId && bet.creator.teamPickId) {
    await supabase.from('bet_participants').insert({
      bet_id: data.id,
      user_id: bet.creatorId,
      username: bet.creator.name,
      team_pick_id: bet.creator.teamPickId,
    })
  }

  const created = rowToBet(data as Record<string, unknown>)
  created.participants = bet.creatorId && bet.creator.teamPickId
    ? [{
        id: '',
        betId: data.id as string,
        userId: bet.creatorId,
        username: bet.creator.name,
        teamPickId: bet.creator.teamPickId,
        joinedAt: new Date().toISOString(),
      }]
    : []

  return created
}

// ── Accept / Decline ──────────────────────────────────────────────────────────
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

// ── Resolve ───────────────────────────────────────────────────────────────────
export async function resolveBet(
  betId: string,
  result: MatchResult,
  losingTeamId: string,
): Promise<void> {
  const isDraw = losingTeamId === 'draw'

  const { error } = await supabase
    .from('bets')
    .update({
      status: isDraw ? 'completed' : 'punishment_pending',
      losing_team_id: losingTeamId,
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

// ── Invite link ───────────────────────────────────────────────────────────────
export async function fetchBetByToken(token: string): Promise<Bet | null> {
  const { data, error } = await supabase
    .from('bets')
    .select('*, bet_participants(*)')
    .eq('invite_token', token)
    .maybeSingle()

  if (error || !data) return null
  const bet = rowToBet(data as Record<string, unknown>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bet.participants = ((data as any).bet_participants ?? []).map(rowToParticipant)
  return bet
}

export async function acceptInvite(
  token: string,
  userId: string,
  username: string,
  teamPickId: string,
): Promise<Bet> {
  // Fetch the bet
  const { data: betData, error: fetchError } = await supabase
    .from('bets')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle()

  if (fetchError || !betData) throw new Error('Bet not found')

  const betId = betData.id as string
  const currentStatus = betData.status as string

  // Check not already resolved
  if (currentStatus === 'punishment_pending' || currentStatus === 'completed') {
    throw new Error('This bet has already been resolved.')
  }

  // Insert participant (unique constraint prevents duplicate joins)
  const { error: insertError } = await supabase
    .from('bet_participants')
    .insert({ bet_id: betId, user_id: userId, username, team_pick_id: teamPickId })

  if (insertError) throw insertError

  // Activate bet if it's still pending (first joiner)
  if (currentStatus === 'pending') {
    await supabase.from('bets').update({ status: 'active' }).eq('id', betId)
  }

  // Notify creator
  const creatorId = betData.creator_id as string
  if (creatorId !== userId) {
    createNotification(
      creatorId,
      betId,
      `${username} joined your bet!`,
      '',
      '',
    ).catch(console.error)
  }

  return rowToBet({
    ...betData as Record<string, unknown>,
    status: currentStatus === 'pending' ? 'active' : currentStatus,
  })
}
