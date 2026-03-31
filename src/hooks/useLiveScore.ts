import { useCallback, useEffect, useRef, useState } from 'react'
import type { Match, MatchResult } from '../types'
import { fetchMatchLiveData, type LiveMatchData } from '../lib/sportsApi'

const POLL_INTERVAL_MS = 45_000 // 45 seconds

export function useLiveScore(
  match: Match | undefined,
  betResolved: boolean,
  onFinished: (result: MatchResult) => void,
): LiveMatchData | null {
  const [liveData, setLiveData] = useState<LiveMatchData | null>(null)
  const resolvedRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  const poll = useCallback(async () => {
    if (!match || betResolved) return
    const data = await fetchMatchLiveData(match)
    if (!data) return
    setLiveData(data)

    if (data.isFinished && !data.isHalfTime && !resolvedRef.current && data.homeScore != null && data.awayScore != null) {
      resolvedRef.current = true
      const winnerId =
        data.homeScore > data.awayScore
          ? match.homeTeam.id
          : data.awayScore > data.homeScore
            ? match.awayTeam.id
            : 'draw'
      onFinishedRef.current({ winnerId, homeScore: data.homeScore, awayScore: data.awayScore })
    }
  }, [match, betResolved])

  useEffect(() => {
    if (!match || betResolved) return
    if (!match.id.startsWith('espn-') && !match.id.startsWith('allsports-')) return

    const kickoff = new Date(match.scheduledAt)
    const now = new Date()
    const msUntilKickoff = kickoff.getTime() - now.getTime()

    // Don't poll if match is more than 3 hours away
    if (msUntilKickoff > 3 * 60 * 60 * 1000) return

    poll()
    const timer = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [match, betResolved, poll])

  return liveData
}
