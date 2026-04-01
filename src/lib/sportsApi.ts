import type { Match, Sport, MatchStatus } from '../types'

// ── AllSports (RapidAPI) ───────────────────────────────────────────────────────
const ALLSPORTS_BASE = 'https://allsportsapi2.p.rapidapi.com'

function allSportsHeaders(): Record<string, string> {
  return {
    'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY ?? '',
    'x-rapidapi-host': import.meta.env.VITE_RAPIDAPI_HOST ?? 'allsportsapi2.p.rapidapi.com',
  }
}

// AllSports status codes
// Football:  6=1st half  7=2nd half  20=Started  31=Halftime  100=Ended  110-112=Extra time  120=Pens
// Basketball: 13-16=Q1-Q4  30=Pause  31=Halftime  100=Ended

const AS_HALFTIME = 31
const AS_FINISHED = 100
const AS_PENS     = 120

// ── Match minute for football ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function footballStatusText(statusCode: number, time: any): string {
  if (statusCode === AS_HALFTIME) return 'HT'
  if (statusCode === AS_PENS) return 'PENS'
  if (statusCode >= 110 && statusCode <= 112) {
    // Extra time — compute from initial (5400 = 90 min)
    if (!time?.currentPeriodStartTimestamp) return 'ET'
    const now = Math.floor(Date.now() / 1000)
    const initial = time.initial ?? 5400
    const minute = Math.floor((initial + (now - time.currentPeriodStartTimestamp)) / 60)
    return `ET ${Math.min(minute, 120 + (time.injuryTime2 ?? 5))}'`
  }
  if (!time?.currentPeriodStartTimestamp) return 'LIVE'
  const now = Math.floor(Date.now() / 1000)
  const initial = time.initial ?? 0 // 0 for 1st half, 2700 (45*60) for 2nd
  const rawMinute = Math.floor((initial + (now - time.currentPeriodStartTimestamp)) / 60)
  const injuryBonus = statusCode === 6 ? (time.injuryTime1 ?? 0) : (time.injuryTime2 ?? 0)
  const cap = statusCode === 6 ? 45 + injuryBonus : 90 + injuryBonus
  return `${Math.min(rawMinute, cap)}'`
}

// ── Quarter time for basketball ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function basketballStatusText(event: any): string {
  const statusCode: number = event.status?.code ?? 0
  if (statusCode === AS_HALFTIME) return 'HT'

  // Derive quarter from lastPeriod ("period1" → Q1, etc.)
  const lastPeriod: string = event.lastPeriod ?? ''
  const periodNum = parseInt(lastPeriod.replace('period', '')) || 1
  const label = periodNum > 4 ? 'OT' : `Q${periodNum}`

  const time = event.time ?? {}
  const periodLength: number = time.periodLength ?? 600
  const now = Math.floor(Date.now() / 1000)
  const elapsed = time.currentPeriodStartTimestamp
    ? now - time.currentPeriodStartTimestamp
    : (time.played ?? 0)
  const remaining = Math.max(0, periodLength - elapsed)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${label} ${m}:${String(s).padStart(2, '0')}`
}

// ── Parse AllSports event → LiveMatchData ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAllSportsLive(event: any, sport: Sport): LiveMatchData {
  const statusCode: number = event.status?.code ?? 0
  const statusType: string  = event.status?.type  ?? ''

  const isHalfTime = statusCode === AS_HALFTIME
  const isFinished = statusType === 'finished' || statusCode === AS_FINISHED
  const isLive     = statusType === 'inprogress' && !isHalfTime

  let statusText = ''
  if (isFinished)              statusText = 'FT'
  else if (isHalfTime)         statusText = 'HT'
  else if (statusType === 'inprogress') {
    statusText = sport === 'basketball'
      ? basketballStatusText(event)
      : footballStatusText(statusCode, event.time ?? {})
  }

  return {
    homeScore: event.homeScore?.current ?? null,
    awayScore: event.awayScore?.current ?? null,
    isLive,
    isHalfTime,
    isFinished,
    statusText,
  }
}

// ── Map AllSports event → Match ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAllSportsEvent(event: any, sport: Sport): Match {
  const ht = event.homeTeam ?? {}
  const at = event.awayTeam ?? {}
  const statusCode: number = event.status?.code ?? 0
  const statusType: string  = event.status?.type  ?? ''

  let status: MatchStatus = 'upcoming'
  if (statusType === 'finished') status = 'finished'
  else if (statusType === 'inprogress') status = 'live'

  const liveData = parseAllSportsLive(event, sport)

  const match: Match = {
    id: `allsports-${event.id}`,
    sport,
    homeTeam: {
      id: String(ht.id ?? 'home'),
      name: ht.name ?? 'Home',
      shortCode: (ht.nameCode ?? ht.name ?? 'HOM').slice(0, 3).toUpperCase(),
      badgeColor: 'bg-slate-600',
      emoji: sport === 'football' ? '⚽' : '🏀',
    },
    awayTeam: {
      id: String(at.id ?? 'away'),
      name: at.name ?? 'Away',
      shortCode: (at.nameCode ?? at.name ?? 'AWY').slice(0, 3).toUpperCase(),
      badgeColor: 'bg-slate-600',
      emoji: sport === 'football' ? '⚽' : '🏀',
    },
    scheduledAt: new Date((event.startTimestamp ?? 0) * 1000).toISOString(),
    status,
    statusText: liveData.statusText || undefined,
  }

  if (statusCode === AS_FINISHED || statusType === 'finished') {
    const homeScore = event.homeScore?.current
    const awayScore = event.awayScore?.current
    if (homeScore != null && awayScore != null) {
      match.result = {
        winnerId:
          homeScore > awayScore
            ? String(ht.id)
            : awayScore > homeScore
              ? String(at.id)
              : 'draw',
        homeScore,
        awayScore,
      }
    }
  }

  return match
}

// ── LiveMatchData interface ───────────────────────────────────────────────────
export interface LiveMatchData {
  homeScore:  number | null
  awayScore:  number | null
  isLive:     boolean      // clock running (not HT)
  isHalfTime: boolean
  isFinished: boolean
  statusText: string       // "67'", "HT", "Q3 4:23", "FT"
}

// ── ESPN helpers for today's scheduled matches ────────────────────────────────
// AllSports has no scheduled/upcoming endpoint — only live (inprogress) events.
// ESPN's scoreboard endpoint reliably returns today's upcoming matches.

const ESPN_TODAY_FOOTBALL_LEAGUES = [
  'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1',
  'ned.1', 'por.1', 'tur.1', 'eng.2',
  'uefa.champions_league', 'uefa.europa', 'uefa.europa.conf',
  'fifa.friendly', 'UEFA.Nations', 'uefa.nations',
  'fifa.worldq.europe', 'fifa.worldq.conmebol', 'fifa.worldq.concacaf',
  'fifa.worldq.afc', 'fifa.worldq.caf',
  'UEFA.EURO', 'fifa.world', 'conmebol.america', 'concacaf.gold',
  'africa.nations', 'eng.fa_cup', 'esp.copa_del_rey',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function espnMapEvent(event: any, sport: Sport): Match | null {
  try {
    const competition = event.competitions[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = competition.competitors.find((c: any) => c.homeAway === 'home')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = competition.competitors.find((c: any) => c.homeAway === 'away')
    if (!home || !away) return null
    const statusName: string = event.status?.type?.name ?? ''
    let status: MatchStatus = 'upcoming'
    if (statusName === 'STATUS_FINAL') status = 'finished'
    else if (statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME') status = 'live'
    return {
      id: `espn-${event.id}`,
      sport,
      homeTeam: {
        id: home.team.id,
        name: home.team.displayName,
        shortCode: home.team.abbreviation,
        badgeColor: 'bg-slate-600',
        emoji: sport === 'football' ? '⚽' : '🏀',
        logo: home.team.logo as string | undefined,
      },
      awayTeam: {
        id: away.team.id,
        name: away.team.displayName,
        shortCode: away.team.abbreviation,
        badgeColor: 'bg-slate-600',
        emoji: sport === 'football' ? '⚽' : '🏀',
        logo: away.team.logo as string | undefined,
      },
      scheduledAt: event.date,
      status,
    }
  } catch { return null }
}

async function fetchEspnUpcoming(dateStr: string): Promise<{ football: Match[]; basketball: Match[] }> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [footballResults, basketballMatches] = await Promise.all([
    Promise.all(
      ESPN_TODAY_FOOTBALL_LEAGUES.map(async (league) => {
        try {
          const res = await fetch(`${ESPN_BASE}/soccer/${league}/scoreboard?dates=${dateStr}`)
          if (!res.ok) return []
          const data = await res.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (data.events ?? []).map((e: any) => espnMapEvent(e, 'football')).filter(Boolean) as Match[]
        } catch { return [] }
      }),
    ),
    (async () => {
      try {
        const res = await fetch(`${ESPN_BASE}/basketball/nba/scoreboard?dates=${dateStr}`)
        if (!res.ok) return []
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.events ?? []).map((e: any) => espnMapEvent(e, 'basketball')).filter(Boolean) as Match[]
      } catch { return [] }
    })(),
  ])

  // Dedup football and filter to upcoming/live only
  const footballMap = new Map<string, Match>()
  for (const m of footballResults.flat()) footballMap.set(m.id, m)
  const upcoming = (m: Match) => m.status !== 'finished' && new Date(m.scheduledAt) >= todayStart

  return {
    football: Array.from(footballMap.values()).filter(upcoming),
    basketball: basketballMatches.filter(upcoming),
  }
}

// ── fetchTodayMatches — AllSports live + ESPN upcoming ───────────────────────
export async function fetchTodayMatches(): Promise<{ football: Match[]; basketball: Match[] }> {
  const today = new Date()
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')

  const [allSportsLive, espnToday] = await Promise.all([
    // AllSports: real-time live matches with accurate minute/score
    (async () => {
      try {
        const res = await fetch(`${ALLSPORTS_BASE}/api/matches/live`, { headers: allSportsHeaders() })
        if (!res.ok) return { football: [] as Match[], basketball: [] as Match[] }
        const data = await res.json()
        const events: unknown[] = data.events ?? []
        const football: Match[] = []
        const basketball: Match[] = []
        for (const e of events) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ev = e as any
          const sportSlug: string = ev.tournament?.category?.sport?.slug ?? ''
          if (sportSlug === 'football') football.push(mapAllSportsEvent(ev, 'football'))
          else if (sportSlug === 'basketball') basketball.push(mapAllSportsEvent(ev, 'basketball'))
        }
        return { football, basketball }
      } catch { return { football: [] as Match[], basketball: [] as Match[] } }
    })(),
    // ESPN: today's scheduled/upcoming matches (AllSports has no scheduled endpoint)
    fetchEspnUpcoming(dateStr),
  ])

  // Merge: AllSports live first, then ESPN upcoming (exclude already-live by team name pair)
  const liveKeys = new Set([
    ...allSportsLive.football.map(m => `${m.homeTeam.name}|${m.awayTeam.name}`),
    ...allSportsLive.basketball.map(m => `${m.homeTeam.name}|${m.awayTeam.name}`),
  ])
  const notAlreadyLive = (m: Match) => !liveKeys.has(`${m.homeTeam.name}|${m.awayTeam.name}`)

  const byKickoff = (a: Match, b: Match) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()

  return {
    football: [
      ...allSportsLive.football,
      ...espnToday.football.filter(notAlreadyLive).sort(byKickoff),
    ],
    basketball: [
      ...allSportsLive.basketball,
      ...espnToday.basketball.filter(notAlreadyLive).sort(byKickoff),
    ],
  }
}

// ── fetchMatchLiveData ────────────────────────────────────────────────────────
// Primary: AllSports by stored event ID
// Fallback: ESPN (legacy for espn- prefixed bets created before this migration)

export async function fetchMatchLiveData(match: Match): Promise<LiveMatchData | null> {
  // ── AllSports path ───────────────────────────────────────────────────────────
  if (match.id.startsWith('allsports-')) {
    const eventId = match.id.slice(10) // strip "allsports-"
    try {
      const res = await fetch(`${ALLSPORTS_BASE}/api/match/${eventId}`, {
        headers: allSportsHeaders(),
      })
      if (!res.ok) return null
      const data = await res.json()
      const event = data.event ?? data
      if (!event?.status) return null
      return parseAllSportsLive(event, match.sport)
    } catch {
      return null
    }
  }

  // ── ESPN legacy path (for bets created before AllSports migration) ───────────
  if (match.id.startsWith('espn-')) {
    return fetchMatchLiveDataEspn(match)
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESPN legacy — kept as fallback for existing bets with espn- match IDs
// ═══════════════════════════════════════════════════════════════════════════════

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

const ESPN_FOOTBALL_LEAGUES = [
  'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1',
  'ned.1', 'por.1', 'tur.1', 'eng.2',
  'uefa.champions_league', 'uefa.europa', 'uefa.europa.conf',
  'fifa.friendly', 'UEFA.Nations', 'uefa.nations',
  'fifa.worldq.europe', 'fifa.worldq.conmebol', 'fifa.worldq.concacaf',
  'fifa.worldq.afc', 'fifa.worldq.caf',
  'UEFA.EURO', 'fifa.world', 'conmebol.america', 'concacaf.gold',
  'africa.nations', 'eng.fa_cup', 'ger.dfb_pokal', 'esp.copa_del_rey',
  'ita.coppa_italia', 'fra.coupe_de_france',
]

const ESPN_SUMMARY_LEAGUES = [
  'fifa.friendly', 'UEFA.Nations', 'uefa.nations',
  'fifa.worldq.europe', 'fifa.worldq.conmebol', 'fifa.worldq.concacaf',
  'fifa.worldq.afc', 'fifa.worldq.caf', 'UEFA.EURO', 'fifa.world',
  'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1',
  'ned.1', 'por.1', 'uefa.champions_league', 'uefa.europa',
  'concacaf.gold', 'africa.nations',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function espnParseEventLive(event: any, sport: Sport): LiveMatchData {
  const competition = event.competitions?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away')
  const statusName: string = event.status?.type?.name ?? ''
  const clock: string  = event.status?.displayClock ?? ''
  const period: number = event.status?.period ?? 0

  const isHalfTime = statusName === 'STATUS_HALFTIME'
  const isFinished = statusName === 'STATUS_FINAL'
  const isLive     = statusName === 'STATUS_IN_PROGRESS' || isHalfTime

  let statusText = ''
  if (isHalfTime) {
    statusText = 'HT'
  } else if (isFinished) {
    statusText = 'FT'
  } else if (statusName === 'STATUS_IN_PROGRESS') {
    if (sport === 'basketball') {
      const label = period <= 4 ? `Q${period}` : period === 5 ? 'OT' : `OT${period - 4}`
      statusText = clock ? `${label} ${clock}` : label
    } else {
      if (period >= 5) statusText = 'PENS'
      else if (period >= 3) statusText = clock ? `ET ${clock.replace(/:.*/, '')}'` : 'ET'
      else {
        const minute = clock ? clock.replace(/:.*/, '') : ''
        statusText = minute ? `${minute}'` : 'LIVE'
      }
    }
  }

  return {
    homeScore: home?.score != null ? Number(home.score) : null,
    awayScore: away?.score != null ? Number(away.score) : null,
    isLive: isLive && !isHalfTime,
    isHalfTime,
    isFinished,
    statusText,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function espnParseSummaryEvent(data: any, sport: Sport): LiveMatchData | null {
  const header = data?.header ?? data
  if (!header?.competitions?.[0]?.competitors) return null
  const competition = header.competitions[0]
  const event = { ...header, status: header.status ?? competition.status }
  return espnParseEventLive(event, sport)
}

// AllSports fallback: find a past or live match by team names + date
// Used when ESPN summary/scoreboard fails to locate an espn- bet's result.
async function fetchAllSportsByTeamNames(
  homeName: string,
  awayName: string,
  dateStr: string, // YYYY-MM-DD
  sport: Sport,
): Promise<LiveMatchData | null> {
  const sportSlug = sport === 'basketball' ? 'basketball' : 'football'
  try {
    const res = await fetch(
      `${ALLSPORTS_BASE}/api/sport/${sportSlug}/scheduled-events/${dateStr}`,
      { headers: allSportsHeaders() },
    )
    if (!res.ok) return null
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = data.events ?? []

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
    const homeNorm = normalize(homeName)
    const awayNorm = normalize(awayName)

    // Fuzzy match: names share a 4-char prefix, or one contains the other
    const nameMatch = (a: string, b: string) => {
      if (!a || !b) return false
      return a.includes(b) || b.includes(a) || (a.length >= 4 && b.startsWith(a.slice(0, 4))) || (b.length >= 4 && a.startsWith(b.slice(0, 4)))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = events.find((e: any) => {
      const hn = normalize(e.homeTeam?.name ?? '')
      const an = normalize(e.awayTeam?.name ?? '')
      return nameMatch(hn, homeNorm) && nameMatch(an, awayNorm)
    })

    if (!event) return null
    return parseAllSportsLive(event, sport)
  } catch { return null }
}

async function fetchMatchLiveDataEspn(match: Match): Promise<LiveMatchData | null> {
  const eventId = match.id.slice(5) // strip "espn-"
  const dateStr = match.scheduledAt.slice(0, 10).replace(/-/g, '')

  // Primary: per-league summary endpoint (works for past & live events)
  if (match.sport === 'basketball') {
    try {
      const res = await fetch(`${ESPN_BASE}/basketball/nba/summary?event=${eventId}`)
      if (res.ok) {
        const parsed = espnParseSummaryEvent(await res.json(), 'basketball')
        if (parsed) return parsed
      }
    } catch { /* fall through */ }
  } else {
    const summaryResults = await Promise.all(
      ESPN_SUMMARY_LEAGUES.map(async (league) => {
        try {
          const res = await fetch(`${ESPN_BASE}/soccer/${league}/summary?event=${eventId}`)
          if (!res.ok) return null
          return espnParseSummaryEvent(await res.json(), 'football')
        } catch { return null }
      }),
    )
    const hit = summaryResults.find(Boolean)
    if (hit) return hit
  }

  // Fallback: scoreboard scan
  if (match.sport === 'basketball') {
    try {
      const res = await fetch(`${ESPN_BASE}/basketball/nba/scoreboard?dates=${dateStr}`)
      if (!res.ok) return null
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = (data.events ?? []).find((e: any) => String(e.id) === eventId)
      return event ? espnParseEventLive(event, 'basketball') : null
    } catch { return null }
  }

  const results = await Promise.all(
    ESPN_FOOTBALL_LEAGUES.map(async (league) => {
      try {
        const res = await fetch(`${ESPN_BASE}/soccer/${league}/scoreboard?dates=${dateStr}`)
        if (!res.ok) return null
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.events ?? []).find((e: any) => String(e.id) === eventId) ?? null
      } catch { return null }
    }),
  )
  const event = results.find(Boolean)
  if (event) return espnParseEventLive(event, 'football')

  // Last resort: AllSports date-based search by team names
  // ESPN event IDs and league paths are unreliable for international friendlies/qualifiers;
  // AllSports has broader coverage and returns finished match scores.
  const matchDate = match.scheduledAt.slice(0, 10) // YYYY-MM-DD
  return fetchAllSportsByTeamNames(match.homeTeam.name, match.awayTeam.name, matchDate, match.sport)
}
