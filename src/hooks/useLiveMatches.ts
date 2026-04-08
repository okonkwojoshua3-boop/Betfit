import { useState, useEffect, useRef } from 'react'
import type { Match } from '../types'
import { fetchTodayMatches, fetchAllSportsLive, mergeMatches } from '../lib/sportsApi'

const SESSION_KEY = 'betfit_today_matches_v5'
const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
const POLL_INTERVAL_MS = 60_000 // refresh live minutes every 60s

export interface LiveMatchesState {
  football: Match[]
  basketball: Match[]
  loading: boolean
  error: boolean
}

export function useLiveMatches(): LiveMatchesState {
  const [state, setState] = useState<LiveMatchesState>({
    football: [],
    basketball: [],
    loading: true,
    error: false,
  })

  // Cache the ESPN upcoming data so polling only refetches the cheap AllSports endpoint
  const espnRef = useRef<{ football: Match[]; basketball: Match[] }>({ football: [], basketball: [] })

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      // Try session cache first
      const cached = sessionStorage.getItem(SESSION_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            date: string
            football: Match[]
            basketball: Match[]
            espnUpcoming: { football: Match[]; basketball: Match[] }
          }
          if (parsed.date === today) {
            espnRef.current = parsed.espnUpcoming ?? { football: [], basketball: [] }
            if (!cancelled) {
              setState({ football: parsed.football, basketball: parsed.basketball, loading: false, error: false })
            }
            return
          }
        } catch {
          // ignore bad cache
        }
      }

      try {
        const { football, basketball, espnUpcoming } = await fetchTodayMatches()
        espnRef.current = espnUpcoming
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ date: today, football, basketball, espnUpcoming }))
        if (!cancelled) {
          setState({ football, basketball, loading: false, error: false })
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: true }))
      }
    }

    initialLoad()

    // Poll AllSports live every 60s to update match minutes in real-time.
    // ESPN upcoming is already cached and doesn't need re-fetching.
    const interval = setInterval(async () => {
      try {
        const live = await fetchAllSportsLive()
        const merged = mergeMatches(live, espnRef.current)
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            football: merged.football,
            basketball: merged.basketball,
          }))
        }
      } catch {
        // silently ignore poll errors — stale data is better than an error state
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return state
}
