import type { Match } from '../types'
import { getLiveMatchById } from '../store/matchStore'

// Generates an ISO date string N days from today at the given UTC hour
function inDays(n: number, hour = 15): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const MATCHES: Match[] = [
  // Football
  {
    id: 'm-afc-mci',
    sport: 'football',
    homeTeam: { id: 'arsenal', name: 'Arsenal', shortCode: 'ARS', badgeColor: 'bg-red-600', emoji: '🔴' },
    awayTeam: { id: 'mancity', name: 'Manchester City', shortCode: 'MCI', badgeColor: 'bg-sky-500', emoji: '🔵' },
    scheduledAt: inDays(0, 15),
    status: 'upcoming',
  },
  {
    id: 'm-liv-che',
    sport: 'football',
    homeTeam: { id: 'liverpool', name: 'Liverpool', shortCode: 'LIV', badgeColor: 'bg-red-700', emoji: '🔴' },
    awayTeam: { id: 'chelsea', name: 'Chelsea', shortCode: 'CHE', badgeColor: 'bg-blue-700', emoji: '🔵' },
    scheduledAt: inDays(0, 17),
    status: 'upcoming',
  },
  {
    id: 'm-bar-rma',
    sport: 'football',
    homeTeam: { id: 'barcelona', name: 'Barcelona', shortCode: 'BAR', badgeColor: 'bg-blue-600', emoji: '🔵' },
    awayTeam: { id: 'realmadrid', name: 'Real Madrid', shortCode: 'RMA', badgeColor: 'bg-white', emoji: '⚪' },
    scheduledAt: inDays(1, 20),
    status: 'upcoming',
  },
  {
    id: 'm-bay-bvb',
    sport: 'football',
    homeTeam: { id: 'bayernmunich', name: 'Bayern Munich', shortCode: 'BAY', badgeColor: 'bg-red-500', emoji: '🔴' },
    awayTeam: { id: 'borussiadortmund', name: 'Borussia Dortmund', shortCode: 'BVB', badgeColor: 'bg-yellow-400', emoji: '🟡' },
    scheduledAt: inDays(1, 17),
    status: 'upcoming',
  },
  {
    id: 'm-psg-mar',
    sport: 'football',
    homeTeam: { id: 'psg', name: 'PSG', shortCode: 'PSG', badgeColor: 'bg-blue-900', emoji: '🔵' },
    awayTeam: { id: 'marseille', name: 'Marseille', shortCode: 'MAR', badgeColor: 'bg-sky-400', emoji: '🔵' },
    scheduledAt: inDays(2, 19),
    status: 'upcoming',
  },
  {
    id: 'm-mun-tot',
    sport: 'football',
    homeTeam: { id: 'manutd', name: 'Manchester Utd', shortCode: 'MUN', badgeColor: 'bg-red-600', emoji: '🔴' },
    awayTeam: { id: 'tottenham', name: 'Tottenham', shortCode: 'TOT', badgeColor: 'bg-slate-100', emoji: '⚪' },
    scheduledAt: inDays(3, 19),
    status: 'upcoming',
  },
  {
    id: 'm-int-juv',
    sport: 'football',
    homeTeam: { id: 'inter', name: 'Inter Milan', shortCode: 'INT', badgeColor: 'bg-blue-800', emoji: '🔵' },
    awayTeam: { id: 'juventus', name: 'Juventus', shortCode: 'JUV', badgeColor: 'bg-slate-900', emoji: '⚫' },
    scheduledAt: inDays(2, 20),
    status: 'upcoming',
  },
  {
    id: 'm-atm-rma',
    sport: 'football',
    homeTeam: { id: 'atletico', name: 'Atlético Madrid', shortCode: 'ATM', badgeColor: 'bg-red-600', emoji: '🔴' },
    awayTeam: { id: 'realmadrid2', name: 'Real Madrid', shortCode: 'RMA', badgeColor: 'bg-white', emoji: '⚪' },
    scheduledAt: inDays(4, 20),
    status: 'upcoming',
  },
  // International Friendlies
  {
    id: 'm-eng-ger',
    sport: 'football',
    homeTeam: { id: 'england', name: 'England', shortCode: 'ENG', badgeColor: 'bg-white', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    awayTeam: { id: 'germany', name: 'Germany', shortCode: 'GER', badgeColor: 'bg-slate-800', emoji: '🇩🇪' },
    scheduledAt: inDays(0, 19),
    status: 'upcoming',
  },
  {
    id: 'm-bra-arg',
    sport: 'football',
    homeTeam: { id: 'brazil', name: 'Brazil', shortCode: 'BRA', badgeColor: 'bg-yellow-400', emoji: '🇧🇷' },
    awayTeam: { id: 'argentina', name: 'Argentina', shortCode: 'ARG', badgeColor: 'bg-sky-400', emoji: '🇦🇷' },
    scheduledAt: inDays(1, 21),
    status: 'upcoming',
  },
  {
    id: 'm-fra-esp',
    sport: 'football',
    homeTeam: { id: 'france', name: 'France', shortCode: 'FRA', badgeColor: 'bg-blue-700', emoji: '🇫🇷' },
    awayTeam: { id: 'spain', name: 'Spain', shortCode: 'ESP', badgeColor: 'bg-red-600', emoji: '🇪🇸' },
    scheduledAt: inDays(2, 20),
    status: 'upcoming',
  },
  {
    id: 'm-nga-gha',
    sport: 'football',
    homeTeam: { id: 'nigeria', name: 'Nigeria', shortCode: 'NGA', badgeColor: 'bg-green-600', emoji: '🇳🇬' },
    awayTeam: { id: 'ghana', name: 'Ghana', shortCode: 'GHA', badgeColor: 'bg-yellow-500', emoji: '🇬🇭' },
    scheduledAt: inDays(3, 17),
    status: 'upcoming',
  },
  {
    id: 'm-ita-por',
    sport: 'football',
    homeTeam: { id: 'italy', name: 'Italy', shortCode: 'ITA', badgeColor: 'bg-blue-600', emoji: '🇮🇹' },
    awayTeam: { id: 'portugal', name: 'Portugal', shortCode: 'POR', badgeColor: 'bg-red-700', emoji: '🇵🇹' },
    scheduledAt: inDays(4, 19),
    status: 'upcoming',
  },
  // Basketball
  {
    id: 'm-lal-chi',
    sport: 'basketball',
    homeTeam: { id: 'lakers', name: 'LA Lakers', shortCode: 'LAL', badgeColor: 'bg-purple-700', emoji: '💜' },
    awayTeam: { id: 'bulls', name: 'Chicago Bulls', shortCode: 'CHI', badgeColor: 'bg-red-600', emoji: '🔴' },
    scheduledAt: inDays(0, 0),
    status: 'upcoming',
  },
  {
    id: 'm-gsw-bos',
    sport: 'basketball',
    homeTeam: { id: 'warriors', name: 'Golden State Warriors', shortCode: 'GSW', badgeColor: 'bg-yellow-500', emoji: '🟡' },
    awayTeam: { id: 'celtics', name: 'Boston Celtics', shortCode: 'BOS', badgeColor: 'bg-green-700', emoji: '🟢' },
    scheduledAt: inDays(0, 2),
    status: 'upcoming',
  },
  {
    id: 'm-mia-bkn',
    sport: 'basketball',
    homeTeam: { id: 'heat', name: 'Miami Heat', shortCode: 'MIA', badgeColor: 'bg-red-500', emoji: '🔴' },
    awayTeam: { id: 'nets', name: 'Brooklyn Nets', shortCode: 'BKN', badgeColor: 'bg-slate-900', emoji: '⚫' },
    scheduledAt: inDays(1, 1),
    status: 'upcoming',
  },
  {
    id: 'm-phx-dal',
    sport: 'basketball',
    homeTeam: { id: 'suns', name: 'Phoenix Suns', shortCode: 'PHX', badgeColor: 'bg-orange-600', emoji: '🟠' },
    awayTeam: { id: 'mavericks', name: 'Dallas Mavericks', shortCode: 'DAL', badgeColor: 'bg-blue-500', emoji: '🔵' },
    scheduledAt: inDays(1, 3),
    status: 'upcoming',
  },
  {
    id: 'm-mil-tor',
    sport: 'basketball',
    homeTeam: { id: 'bucks', name: 'Milwaukee Bucks', shortCode: 'MIL', badgeColor: 'bg-green-600', emoji: '🟢' },
    awayTeam: { id: 'raptors', name: 'Toronto Raptors', shortCode: 'TOR', badgeColor: 'bg-red-700', emoji: '🔴' },
    scheduledAt: inDays(2, 0),
    status: 'upcoming',
  },
]

export function getMatchById(id: string): Match | undefined {
  return MATCHES.find((m) => m.id === id) ?? getLiveMatchById(id)
}
