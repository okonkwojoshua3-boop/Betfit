export type Sport = 'football' | 'basketball'

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Team {
  id: string
  name: string
  shortCode: string
  badgeColor: string
  emoji: string
}

export interface MatchResult {
  winnerId: string // team id or 'draw'
  homeScore: number
  awayScore: number
}

export interface Match {
  id: string
  sport: Sport
  homeTeam: Team
  awayTeam: Team
  scheduledAt: string
  status: MatchStatus
  result?: MatchResult
}

export interface Punishment {
  id: string
  name: string
  emoji: string
  defaultReps: number
  isTimeBased: boolean
}

export interface PunishmentAssignment {
  punishmentId: string
  reps: number
}

export type BetStatus = 'active' | 'punishment_pending' | 'completed'

export interface Participant {
  name: string
  teamPickId: string
}

export interface Bet {
  id: string
  matchId: string
  creator: Participant
  opponent: Participant
  punishment: PunishmentAssignment
  status: BetStatus
  createdAt: string
  resolvedAt?: string
  loserId?: 'creator' | 'opponent' | 'draw'
}
