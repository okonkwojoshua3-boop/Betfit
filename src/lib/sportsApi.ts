import type { Match, Sport, MatchStatus } from '../types'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const FOOTBALL_LEAGUES = [
  // Top 5 European Leagues
  'eng.1',          // Premier League
  'esp.1',          // La Liga
  'ger.1',          // Bundesliga
  'ita.1',          // Serie A
  'fra.1',          // Ligue 1
  // Other top club leagues
  'ned.1',          // Eredivisie
  'por.1',          // Primeira Liga
  'tur.1',          // Super Lig
  'eng.2',          // Championship
  // UEFA Club Competitions
  'uefa.champions_league',
  'uefa.europa',
  'uefa.europa.conf',
  // International / National Teams
  'fifa.friendly',  // International friendlies
  'UEFA.Nations',   // UEFA Nations League
  'UEFA.EURO',      // UEFA Euros
  'fifa.world',     // FIFA World Cup
  'conmebol.america', // Copa America
]

const TEAM_META: Record<string, { emoji: string; badgeColor: string }> = {
  // Premier League
  ARS: { emoji: '🔴', badgeColor: 'bg-red-600' },
  CHE: { emoji: '🔵', badgeColor: 'bg-blue-700' },
  LIV: { emoji: '🔴', badgeColor: 'bg-red-700' },
  MCI: { emoji: '🔵', badgeColor: 'bg-sky-500' },
  MAN: { emoji: '🔴', badgeColor: 'bg-red-600' },
  TOT: { emoji: '⚪', badgeColor: 'bg-slate-300' },
  NEW: { emoji: '⚫', badgeColor: 'bg-slate-800' },
  AVL: { emoji: '🟣', badgeColor: 'bg-purple-800' },
  WHU: { emoji: '🟣', badgeColor: 'bg-purple-700' },
  BHA: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  EVE: { emoji: '🔵', badgeColor: 'bg-blue-800' },
  WOL: { emoji: '🟠', badgeColor: 'bg-orange-500' },
  CRY: { emoji: '🔴', badgeColor: 'bg-red-600' },
  FUL: { emoji: '⚪', badgeColor: 'bg-slate-200' },
  BRE: { emoji: '🔴', badgeColor: 'bg-red-500' },
  NFO: { emoji: '🔴', badgeColor: 'bg-red-700' },
  LEI: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  SOU: { emoji: '🔴', badgeColor: 'bg-red-600' },
  IPS: { emoji: '🔵', badgeColor: 'bg-blue-700' },
  SUN: { emoji: '🔴', badgeColor: 'bg-red-600' },
  // La Liga
  BAR: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  RMA: { emoji: '⚪', badgeColor: 'bg-slate-100' },
  ATM: { emoji: '🔴', badgeColor: 'bg-red-600' },
  SEV: { emoji: '🔴', badgeColor: 'bg-red-500' },
  VAL: { emoji: '🟠', badgeColor: 'bg-orange-400' },
  VIL: { emoji: '🟡', badgeColor: 'bg-yellow-500' },
  BET: { emoji: '🟢', badgeColor: 'bg-green-600' },
  CEL: { emoji: '🔵', badgeColor: 'bg-sky-400' },
  RSO: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  ATH: { emoji: '🔴', badgeColor: 'bg-red-700' },
  // Bundesliga
  BAY: { emoji: '🔴', badgeColor: 'bg-red-500' },
  BVB: { emoji: '🟡', badgeColor: 'bg-yellow-400' },
  RBL: { emoji: '🔴', badgeColor: 'bg-red-600' },
  LEV: { emoji: '🔴', badgeColor: 'bg-red-500' },
  SGE: { emoji: '🔴', badgeColor: 'bg-red-700' },
  VFB: { emoji: '🔴', badgeColor: 'bg-red-500' },
  WOB: { emoji: '🟢', badgeColor: 'bg-green-600' },
  BMG: { emoji: '🟢', badgeColor: 'bg-green-500' },
  // Serie A
  INT: { emoji: '🔵', badgeColor: 'bg-blue-800' },
  JUV: { emoji: '⚫', badgeColor: 'bg-slate-900' },
  ROM: { emoji: '🔴', badgeColor: 'bg-red-700' },
  SSN: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  LAZ: { emoji: '🔵', badgeColor: 'bg-sky-400' },
  FIO: { emoji: '🟣', badgeColor: 'bg-purple-600' },
  // Ligue 1
  PSG: { emoji: '🔵', badgeColor: 'bg-blue-900' },
  MAR: { emoji: '🔵', badgeColor: 'bg-sky-400' },
  LYO: { emoji: '🔴', badgeColor: 'bg-red-600' },
  MON: { emoji: '🔴', badgeColor: 'bg-red-500' },
  LIL: { emoji: '🔴', badgeColor: 'bg-red-600' },
  // NBA
  LAL: { emoji: '💜', badgeColor: 'bg-purple-700' },
  GSW: { emoji: '🟡', badgeColor: 'bg-yellow-500' },
  BOS: { emoji: '🟢', badgeColor: 'bg-green-700' },
  CHI: { emoji: '🔴', badgeColor: 'bg-red-600' },
  MIA: { emoji: '🔴', badgeColor: 'bg-red-500' },
  BKN: { emoji: '⚫', badgeColor: 'bg-slate-900' },
  PHX: { emoji: '🟠', badgeColor: 'bg-orange-600' },
  DAL: { emoji: '🔵', badgeColor: 'bg-blue-500' },
  MIL: { emoji: '🟢', badgeColor: 'bg-green-600' },
  TOR: { emoji: '🔴', badgeColor: 'bg-red-700' },
  DEN: { emoji: '🔵', badgeColor: 'bg-blue-800' },
  PHI: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  NYK: { emoji: '🟠', badgeColor: 'bg-orange-500' },
  MEM: { emoji: '🔵', badgeColor: 'bg-blue-700' },
  NOP: { emoji: '🔵', badgeColor: 'bg-blue-800' },
  SAC: { emoji: '🟣', badgeColor: 'bg-purple-600' },
  POR: { emoji: '🔴', badgeColor: 'bg-red-600' },
  MIN: { emoji: '🟢', badgeColor: 'bg-green-700' },
  CLE: { emoji: '🔴', badgeColor: 'bg-red-700' },
  OKC: { emoji: '🔵', badgeColor: 'bg-blue-500' },
  IND: { emoji: '🟡', badgeColor: 'bg-yellow-500' },
  ATL: { emoji: '🔴', badgeColor: 'bg-red-500' },
  CHA: { emoji: '🟣', badgeColor: 'bg-purple-500' },
  DET: { emoji: '🔴', badgeColor: 'bg-red-600' },
  ORL: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  WAS: { emoji: '🔴', badgeColor: 'bg-red-600' },
  SAS: { emoji: '⚫', badgeColor: 'bg-slate-700' },
  HOU: { emoji: '🔴', badgeColor: 'bg-red-600' },
  LAC: { emoji: '🔵', badgeColor: 'bg-blue-600' },
  UTA: { emoji: '🟢', badgeColor: 'bg-green-700' },
}

function getTeamMeta(abbr: string, sport: Sport) {
  return TEAM_META[abbr] ?? {
    emoji: sport === 'football' ? '⚽' : '🏀',
    badgeColor: 'bg-slate-600',
  }
}

function mapStatus(espnStatusName: string): MatchStatus {
  if (espnStatusName === 'STATUS_FINAL') return 'finished'
  if (espnStatusName === 'STATUS_IN_PROGRESS') return 'live'
  return 'upcoming'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(event: any, sport: Sport): Match | null {
  try {
    const competition = event.competitions[0]
    const home = competition.competitors.find((c: any) => c.homeAway === 'home')
    const away = competition.competitors.find((c: any) => c.homeAway === 'away')
    if (!home || !away) return null

    const homeAbbr: string = home.team.abbreviation
    const awayAbbr: string = away.team.abbreviation
    const status = mapStatus(event.status.type.name)

    const match: Match = {
      id: `espn-${event.id}`,
      sport,
      homeTeam: {
        id: home.team.id,
        name: home.team.displayName,
        shortCode: homeAbbr,
        ...getTeamMeta(homeAbbr, sport),
      },
      awayTeam: {
        id: away.team.id,
        name: away.team.displayName,
        shortCode: awayAbbr,
        ...getTeamMeta(awayAbbr, sport),
      },
      scheduledAt: event.date,
      status,
    }

    if (status === 'finished' && home.score != null && away.score != null) {
      const homeScore = Number(home.score)
      const awayScore = Number(away.score)
      match.result = {
        winnerId:
          homeScore > awayScore
            ? home.team.id
            : awayScore > homeScore
              ? away.team.id
              : 'draw',
        homeScore,
        awayScore,
      }
    }

    return match
  } catch {
    return null
  }
}

async function fetchLeague(url: string, sport: Sport): Promise<Match[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const events: unknown[] = data.events ?? []
    return events.map((e) => mapEvent(e, sport)).filter((m): m is Match => m !== null)
  } catch {
    return []
  }
}

// ── Live score for a single match ─────────────────────────────────────────────

export interface LiveMatchData {
  homeScore: number | null
  awayScore: number | null
  isLive: boolean
  isFinished: boolean
  statusText: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEventLive(event: any): LiveMatchData {
  const competition = event.competitions?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away')
  const statusName: string = event.status?.type?.name ?? ''
  const isLive = statusName === 'STATUS_IN_PROGRESS'
  const isFinished = statusName === 'STATUS_FINAL'
  const clock: string = event.status?.displayClock ?? ''
  const period: number = event.status?.period ?? 0

  let statusText = 'Scheduled'
  if (isLive && clock) {
    statusText = period >= 2 ? `2H ${clock}` : `${clock}'`
  } else if (isLive) {
    statusText = 'LIVE'
  } else if (isFinished) {
    statusText = 'FT'
  }

  return {
    homeScore: home?.score != null ? Number(home.score) : null,
    awayScore: away?.score != null ? Number(away.score) : null,
    isLive,
    isFinished,
    statusText,
  }
}

export async function fetchMatchLiveData(match: Match): Promise<LiveMatchData | null> {
  if (!match.id.startsWith('espn-')) return null
  const eventId = match.id.slice(5)
  const dateStr = match.scheduledAt.slice(0, 10).replace(/-/g, '')

  if (match.sport === 'basketball') {
    try {
      const res = await fetch(`${ESPN_BASE}/basketball/nba/scoreboard?dates=${dateStr}`)
      if (!res.ok) return null
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = (data.events ?? []).find((e: any) => e.id === eventId)
      return event ? parseEventLive(event) : null
    } catch {
      return null
    }
  }

  // Football: scan all leagues in parallel
  const results = await Promise.all(
    FOOTBALL_LEAGUES.map(async (league) => {
      try {
        const res = await fetch(`${ESPN_BASE}/soccer/${league}/scoreboard?dates=${dateStr}`)
        if (!res.ok) return null
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.events ?? []).find((e: any) => e.id === eventId) ?? null
      } catch {
        return null
      }
    }),
  )
  const event = results.find(Boolean)
  return event ? parseEventLive(event) : null
}

export async function fetchTodayMatches(): Promise<{ football: Match[]; basketball: Match[] }> {
  const today = new Date()
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')

  const [footballResults, basketballMatches] = await Promise.all([
    Promise.all(
      FOOTBALL_LEAGUES.map((league) =>
        fetchLeague(`${ESPN_BASE}/soccer/${league}/scoreboard?dates=${dateStr}`, 'football'),
      ),
    ),
    fetchLeague(`${ESPN_BASE}/basketball/nba/scoreboard?dates=${dateStr}`, 'basketball'),
  ])

  // Deduplicate football matches by id (a match may appear in multiple league feeds)
  const footballMap = new Map<string, Match>()
  for (const match of footballResults.flat()) {
    footballMap.set(match.id, match)
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  function notPast(m: Match) {
    return m.status === 'live' || new Date(m.scheduledAt) >= todayStart
  }

  return {
    football: Array.from(footballMap.values()).filter(notPast),
    basketball: basketballMatches.filter(notPast),
  }
}
