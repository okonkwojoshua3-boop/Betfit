import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '../types'
import { fetchLeaderboardStats } from '../services/profileService'

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboardStats()
      .then(setEntries)
      .catch((err) => setError(err?.message ?? 'Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  return { entries, loading, error }
}
