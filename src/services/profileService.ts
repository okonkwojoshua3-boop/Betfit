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

export type ProfileUpdate = {
  username?: string
  bio?: string | null
  avatar_url?: string | null
  notifications_enabled?: boolean
  favourite_team?: string | null
  favourite_sport?: string | null
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}

export async function checkUsernameAvailable(username: string, currentUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', currentUserId)
    .maybeSingle()

  return data === null
}

// Resize and center-crop an image file to 200×200 JPEG, return as Blob
export function resizeImageTo200(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      const size = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth  - size) / 2
      const sy = (img.naturalHeight - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to encode image'))
      }, 'image/jpeg', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')) }
    img.src = objectUrl
  })
}

export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Bust cache by appending a timestamp query param
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function fetchLeaderboardStats(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard_stats')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: row.username as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    wins: Number(row.wins),
    losses: Number(row.losses),
    draws: Number(row.draws),
    winRate: Number(row.win_rate),
    punishmentsOwed: Number(row.punishments_owed),
    punishmentsCompleted: Number(row.punishments_completed),
  }))
}
