import type { Match } from '../types'

const STORAGE_KEY = 'betfit_live_matches'

function getAll(): Record<string, Match> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveMatch(match: Match): void {
  const stored = getAll()
  stored[match.id] = match
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function getLiveMatchById(id: string): Match | undefined {
  return getAll()[id]
}
