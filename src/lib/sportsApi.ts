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

// ── fetchTodayMatches — AllSports live + today's scheduled ───────────────────
export async function fetchTodayMatches(): Promise<{ football: Match[]; basketball: Match[] }> {
  const now = new Date()
  const dd   = String(now.getDate()).padStart(2, '0')
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const dateParam = `${dd}.${mm}.${yyyy}` // AllSports date format: DD.MM.YYYY

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetchEvents(url: string): Promise<any[]> {
    try {
      const res = await fetch(url, { headers: allSportsHeaders() })
      if (!res.ok) return []
      const data = await res.json()
      return data.events ?? []
    } catch {
      return []
    }
  }

  const [liveEvents, footballEvents, basketballEvents] = await Promise.all([
    fetchEvents(`${ALLSPORTS_BASE}/api/matches/live`),
    fetchEvents(`${ALLSPORTS_BASE}/api/football/${dateParam}/matches`),
    fetchEvents(`${ALLSPORTS_BASE}/api/basketball/${dateParam}/matches`),
  ])

  const football: Match[]  = []
  const basketball: Match[] = []
  const seen = new Set<number>()

  // Live events first — they carry real-time score/status data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ev of liveEvents as any[]) {
    const sportSlug: string = ev.tournament?.category?.sport?.slug ?? ''
    if (sportSlug === 'football') {
      seen.add(ev.id)
      football.push(mapAllSportsEvent(ev, 'football'))
    } else if (sportSlug === 'basketball') {
      seen.add(ev.id)
      basketball.push(mapAllSportsEvent(ev, 'basketball'))
    }
  }

  // Today's scheduled football — skip already-seen (live) and finished matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ev of footballEvents as any[]) {
    if (seen.has(ev.id)) continue
    if ((ev.status?.type ?? '') === 'finished') continue
    seen.add(ev.id)
    football.push(mapAllSportsEvent(ev, 'football'))
  }

  // Today's scheduled basketball — same dedup/filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ev of basketballEvents as any[]) {
    if (seen.has(ev.id)) continue
    if ((ev.status?.type ?? '') === 'finished') continue
    seen.add(ev.id)
    basketball.push(mapAllSportsEvent(ev, 'basketball'))
  }

  return { football, basketball }
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
  return event ? espnParseEventLive(event, 'football') : null
}
