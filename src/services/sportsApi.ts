import type { MatchResult } from '../types'

const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

// Maps our internal team IDs → TheSportsDB team IDs
const TEAM_DB_IDS: Record<string, string> = {
  // Premier League
  arsenal: '133604',
  mancity: '133613',
  liverpool: '133602',
  chelsea: '133610',
  manutd: '133612',
  tottenham: '133619',
  // La Liga
  barcelona: '133739',
  realmadrid: '133742',
  // Bundesliga
  bayernmunich: '134825',
  borussiadortmund: '134830',
  // Ligue 1
  psg: '133719',
  marseille: '133720',
  // NBA
  lakers: '134870',
  bulls: '134860',
  warriors: '134866',
  celtics: '134864',
  heat: '134874',
  nets: '134872',
  suns: '134880',
  mavericks: '134862',
  bucks: '134858',
  raptors: '134878',
}

interface SportsDbEvent {
  idEvent: string
  strEvent: string
  dateEvent: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
}

/**
 * Fetches the result of a match from TheSportsDB.
 * Returns null if the match hasn't finished or isn't found.
 */
export async function fetchMatchResult(
  homeTeamId: string,
  awayTeamId: string,
  awayTeamName: string,
  scheduledAt: string,
): Promise<MatchResult | null> {
  const dbId = TEAM_DB_IDS[homeTeamId]
  if (!dbId) return null

  try {
    const res = await fetch(`${BASE}/eventslast.php?id=${dbId}`)
    if (!res.ok) return null

    const data = await res.json()
    const events: SportsDbEvent[] = data.results ?? []

    const scheduledDate = new Date(scheduledAt)

    // Find the event matching our away team within ±7 days of the scheduled date
    const firstWord = (s: string) => s.split(' ')[0].toLowerCase()
    const event = events.find((e) => {
      const eventDate = new Date(e.dateEvent)
      const daysDiff =
        Math.abs(eventDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
      const awayMatch =
        e.strAwayTeam.toLowerCase().includes(firstWord(awayTeamName)) ||
        awayTeamName.toLowerCase().includes(firstWord(e.strAwayTeam))
      return awayMatch && daysDiff <= 7
    })

    if (!event) return null
    if (event.intHomeScore === null || event.intAwayScore === null) return null

    const homeScore = parseInt(event.intHomeScore)
    const awayScore = parseInt(event.intAwayScore)

    let winnerId: string
    if (homeScore > awayScore) winnerId = homeTeamId
    else if (awayScore > homeScore) winnerId = awayTeamId
    else winnerId = 'draw'

    return { homeScore, awayScore, winnerId }
  } catch {
    return null
  }
}
