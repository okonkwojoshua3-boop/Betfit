import { supabase } from '../lib/supabase'
import type { Profile } from '../store/AuthContext'

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
