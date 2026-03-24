import type { Player } from '../types'

const KEY = 'betfit_players'

export function getPlayers(): Player[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function savePlayers(players: Player[]): void {
  localStorage.setItem(KEY, JSON.stringify(players))
}

export function createPlayer(name: string): Player {
  return {
    id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
}
