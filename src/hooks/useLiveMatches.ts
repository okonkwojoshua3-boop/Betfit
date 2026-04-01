import { useState, useEffect } from 'react'
import type { Match } from '../types'
import { fetchTodayMatches } from '../lib/sportsApi'

const SESSION_KEY = 'betfit_today_matches_v2'
const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

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

  useEffect(() => {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { date: string; football: Match[]; basketball: Match[] }
        if (parsed.date === today) {
          setState({ football: parsed.football, basketball: parsed.basketball, loading: false, error: false })
          return
        }
      } catch {
        // ignore bad cache
      }
    }

    fetchTodayMatches()
      .then(({ football, basketball }) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ date: today, football, basketball }))
        setState({ football, basketball, loading: false, error: false })
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false, error: true }))
      })
  }, [])

  return state
}
