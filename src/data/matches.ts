import type { Match } from '../types'
import { getLiveMatchById } from '../store/matchStore'

export const MATCHES: Match[] = [
  // Football
  {
    id: 'm-afc-mci',
    sport: 'football',
    homeTeam: { id: 'arsenal', name: 'Arsenal', shortCode: 'ARS', badgeColor: 'bg-red-600', emoji: '🔴' },
    awayTeam: { id: 'mancity', name: 'Manchester City', shortCode: 'MCI', badgeColor: 'bg-sky-500', emoji: '🔵' },
    scheduledAt: '2026-03-25T15:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-liv-che',
    sport: 'football',
    homeTeam: { id: 'liverpool', name: 'Liverpool', shortCode: 'LIV', badgeColor: 'bg-red-700', emoji: '🔴' },
    awayTeam: { id: 'chelsea', name: 'Chelsea', shortCode: 'CHE', badgeColor: 'bg-blue-700', emoji: '🔵' },
    scheduledAt: '2026-03-26T17:30:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-bar-rma',
    sport: 'football',
    homeTeam: { id: 'barcelona', name: 'Barcelona', shortCode: 'BAR', badgeColor: 'bg-blue-600', emoji: '🔵' },
    awayTeam: { id: 'realmadrid', name: 'Real Madrid', shortCode: 'RMA', badgeColor: 'bg-white', emoji: '⚪' },
    scheduledAt: '2026-03-27T20:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-bay-bvb',
    sport: 'football',
    homeTeam: { id: 'bayernmunich', name: 'Bayern Munich', shortCode: 'BAY', badgeColor: 'bg-red-500', emoji: '🔴' },
    awayTeam: { id: 'borussiadortmund', name: 'Borussia Dortmund', shortCode: 'BVB', badgeColor: 'bg-yellow-400', emoji: '🟡' },
    scheduledAt: '2026-03-28T17:30:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-psg-mar',
    sport: 'football',
    homeTeam: { id: 'psg', name: 'PSG', shortCode: 'PSG', badgeColor: 'bg-blue-900', emoji: '🔵' },
    awayTeam: { id: 'marseille', name: 'Marseille', shortCode: 'MAR', badgeColor: 'bg-sky-400', emoji: '🔵' },
    scheduledAt: '2026-03-29T19:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-mun-tot',
    sport: 'football',
    homeTeam: { id: 'manutd', name: 'Manchester Utd', shortCode: 'MUN', badgeColor: 'bg-red-600', emoji: '🔴' },
    awayTeam: { id: 'tottenham', name: 'Tottenham', shortCode: 'TOT', badgeColor: 'bg-slate-100', emoji: '⚪' },
    scheduledAt: '2026-04-01T19:45:00Z',
    status: 'upcoming',
  },
  // Basketball
  {
    id: 'm-lal-chi',
    sport: 'basketball',
    homeTeam: { id: 'lakers', name: 'LA Lakers', shortCode: 'LAL', badgeColor: 'bg-purple-700', emoji: '💜' },
    awayTeam: { id: 'bulls', name: 'Chicago Bulls', shortCode: 'CHI', badgeColor: 'bg-red-600', emoji: '🔴' },
    scheduledAt: '2026-03-25T00:30:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-gsw-bos',
    sport: 'basketball',
    homeTeam: { id: 'warriors', name: 'Golden State Warriors', shortCode: 'GSW', badgeColor: 'bg-yellow-500', emoji: '🟡' },
    awayTeam: { id: 'celtics', name: 'Boston Celtics', shortCode: 'BOS', badgeColor: 'bg-green-700', emoji: '🟢' },
    scheduledAt: '2026-03-26T02:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-mia-bkn',
    sport: 'basketball',
    homeTeam: { id: 'heat', name: 'Miami Heat', shortCode: 'MIA', badgeColor: 'bg-red-500', emoji: '🔴' },
    awayTeam: { id: 'nets', name: 'Brooklyn Nets', shortCode: 'BKN', badgeColor: 'bg-slate-900', emoji: '⚫' },
    scheduledAt: '2026-03-27T01:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-phx-dal',
    sport: 'basketball',
    homeTeam: { id: 'suns', name: 'Phoenix Suns', shortCode: 'PHX', badgeColor: 'bg-orange-600', emoji: '🟠' },
    awayTeam: { id: 'mavericks', name: 'Dallas Mavericks', shortCode: 'DAL', badgeColor: 'bg-blue-500', emoji: '🔵' },
    scheduledAt: '2026-03-28T02:30:00Z',
    status: 'upcoming',
  },
  {
    id: 'm-mil-tor',
    sport: 'basketball',
    homeTeam: { id: 'bucks', name: 'Milwaukee Bucks', shortCode: 'MIL', badgeColor: 'bg-green-600', emoji: '🟢' },
    awayTeam: { id: 'raptors', name: 'Toronto Raptors', shortCode: 'TOR', badgeColor: 'bg-red-700', emoji: '🔴' },
    scheduledAt: '2026-03-29T00:00:00Z',
    status: 'upcoming',
  },
]

export function getMatchById(id: string): Match | undefined {
  return MATCHES.find((m) => m.id === id) ?? getLiveMatchById(id)
}
