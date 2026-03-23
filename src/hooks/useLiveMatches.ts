import { useState, useEffect } from 'react'
import type { Match } from '../types'
import { fetchTodayMatches } from '../lib/sportsApi'

const SESSION_KEY = 'betfit_today_matches'

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
        const parsed = JSON.parse(cached) as { football: Match[]; basketball: Match[] }
        setState({ ...parsed, loading: false, error: false })
        return
      } catch {
        // ignore bad cache
      }
    }

    fetchTodayMatches()
      .then(({ football, basketball }) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ football, basketball }))
        setState({ football, basketball, loading: false, error: false })
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false, error: true }))
      })
  }, [])

  return state
}
