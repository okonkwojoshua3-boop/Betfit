import { supabase } from '../lib/supabase'
import type { AppNotification } from '../types'

function rowToNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: row.id as string,
    betId: row.bet_id as string,
    message: row.message as string,
    loserName: row.loser_name as string ?? '',
    punishment: row.punishment as string ?? '',
    createdAt: row.created_at as string,
    read: row.read as boolean,
  }
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToNotification)
}

export async function createNotification(
  userId: string,
  betId: string,
  message: string,
  loserName: string,
  punishment: string,
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    bet_id: betId,
    message,
    loser_name: loserName,
    punishment,
  })

  if (error) throw error
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
}
