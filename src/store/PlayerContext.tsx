import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Profile } from './AuthContext'
import { fetchAllProfiles, searchProfiles } from '../services/profileService'

interface PlayerStore {
  players: Profile[]
  searchUsers: (query: string) => Promise<Profile[]>
  refresh: () => Promise<void>
}

const PlayerContext = createContext<PlayerStore | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Profile[]>([])

  const refresh = useCallback(async () => {
    const profiles = await fetchAllProfiles()
    setPlayers(profiles)
  }, [])

  useEffect(() => {
    refresh().catch(console.error)
  }, [refresh])

  const searchUsers = useCallback(async (query: string): Promise<Profile[]> => {
    if (!query.trim()) return players
    return searchProfiles(query)
  }, [players])

  return (
    <PlayerContext.Provider value={{ players, searchUsers, refresh }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayers(): PlayerStore {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayers must be used within PlayerProvider')
  return ctx
}
