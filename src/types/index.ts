export type Sport = 'football' | 'basketball'

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Team {
  id: string
  name: string
  shortCode: string
  badgeColor: string
  emoji: string
  logo?: string
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
  statusText?: string   // live progress: "67'", "HT", "Q3 4:23", "FT"
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

export type BetStatus = 'pending' | 'active' | 'punishment_pending' | 'completed' | 'cancel_requested' | 'cancelled'

export interface Player {
  id: string
  name: string
  createdAt: string
}

export interface BetProof {
  betId: string
  fileUrl: string        // Supabase Storage signed URL
  uploadedAt: string
  status: 'pending_review' | 'approved' | 'rejected'
  rejectionNote?: string
}

export interface AppNotification {
  id: string
  betId: string
  message: string
  loserName: string
  punishment: string
  createdAt: string
  read: boolean
}

export interface Participant {
  name: string
  teamPickId?: string
}

export interface BetParticipant {
  id: string
  betId: string
  userId: string
  username: string
  teamPickId: string
  joinedAt: string
}

export interface Bet {
  id: string
  matchId: string
  creatorId?: string
  creator: Participant        // creator display name (kept for UI)
  opponent: Participant       // kept for backwards compat
  punishment: PunishmentAssignment
  status: BetStatus
  createdAt: string
  resolvedAt?: string
  loserId?: 'creator' | 'opponent' | 'draw'  // legacy 1v1 field
  losingTeamId?: string      // group bets: team id that lost, or 'draw'
  inviteToken?: string
  opponentId?: string       // set for 1v1 bets — only this user can join
  sport?: Sport             // stored so BetDetail works on any device
  matchScheduledAt?: string // stored so BetDetail works on any device
  homeTeamName?: string
  awayTeamName?: string
  homeTeamEmoji?: string
  awayTeamEmoji?: string
  homeTeamId?: string       // real ESPN team ID for home team
  awayTeamId?: string       // real ESPN team ID for away team
  homeTeamLogo?: string
  awayTeamLogo?: string
  homeScore?: number
  awayScore?: number
  participants?: BetParticipant[]
}
