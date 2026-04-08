import { supabase } from '../lib/supabase'
import type { Profile } from '../store/AuthContext'
import type { LeaderboardEntry } from '../types'

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  if (error) throw error
  return data ?? []
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data ?? []
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  return data ?? null
}

export async function fetchLeaderboardStats(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard_stats')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    wins: Number(row.wins),
    losses: Number(row.losses),
    draws: Number(row.draws),
    winRate: Number(row.win_rate),
    punishmentsOwed: Number(row.punishments_owed),
    punishmentsCompleted: Number(row.punishments_completed),
  }))
}
