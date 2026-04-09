export interface TeamOption {
  name: string
  logo: string
  league: string
  sport: 'football' | 'basketball'
}

const soccerLogo = (id: number) =>
  `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`

const nbaLogo = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`

export const POPULAR_TEAMS: TeamOption[] = [
  // Premier League
  { name: 'Arsenal',            logo: soccerLogo(359),   league: 'Premier League',  sport: 'football' },
  { name: 'Chelsea',            logo: soccerLogo(363),   league: 'Premier League',  sport: 'football' },
  { name: 'Liverpool',          logo: soccerLogo(364),   league: 'Premier League',  sport: 'football' },
  { name: 'Manchester City',    logo: soccerLogo(382),   league: 'Premier League',  sport: 'football' },
  { name: 'Manchester United',  logo: soccerLogo(360),   league: 'Premier League',  sport: 'football' },
  { name: 'Tottenham Hotspur',  logo: soccerLogo(367),   league: 'Premier League',  sport: 'football' },
  { name: 'Newcastle United',   logo: soccerLogo(361),   league: 'Premier League',  sport: 'football' },
  { name: 'Aston Villa',        logo: soccerLogo(1213),  league: 'Premier League',  sport: 'football' },
  { name: 'West Ham United',    logo: soccerLogo(371),   league: 'Premier League',  sport: 'football' },
  { name: 'Brighton',           logo: soccerLogo(331),   league: 'Premier League',  sport: 'football' },
  // La Liga
  { name: 'Real Madrid',        logo: soccerLogo(86),    league: 'La Liga',         sport: 'football' },
  { name: 'FC Barcelona',       logo: soccerLogo(83),    league: 'La Liga',         sport: 'football' },
  { name: 'Atletico Madrid',    logo: soccerLogo(1068),  league: 'La Liga',         sport: 'football' },
  { name: 'Sevilla FC',         logo: soccerLogo(92),    league: 'La Liga',         sport: 'football' },
  { name: 'Real Betis',         logo: soccerLogo(88),    league: 'La Liga',         sport: 'football' },
  // Bundesliga
  { name: 'Bayern Munich',      logo: soccerLogo(132),   league: 'Bundesliga',      sport: 'football' },
  { name: 'Borussia Dortmund',  logo: soccerLogo(124),   league: 'Bundesliga',      sport: 'football' },
  { name: 'Bayer Leverkusen',   logo: soccerLogo(131),   league: 'Bundesliga',      sport: 'football' },
  { name: 'RB Leipzig',         logo: soccerLogo(11420), league: 'Bundesliga',      sport: 'football' },
  // Serie A
  { name: 'Juventus',           logo: soccerLogo(111),   league: 'Serie A',         sport: 'football' },
  { name: 'Inter Milan',        logo: soccerLogo(110),   league: 'Serie A',         sport: 'football' },
  { name: 'AC Milan',           logo: soccerLogo(103),   league: 'Serie A',         sport: 'football' },
  { name: 'AS Roma',            logo: soccerLogo(113),   league: 'Serie A',         sport: 'football' },
  { name: 'Napoli',             logo: soccerLogo(114),   league: 'Serie A',         sport: 'football' },
  // Ligue 1
  { name: 'Paris Saint-Germain',logo: soccerLogo(160),   league: 'Ligue 1',         sport: 'football' },
  { name: 'Olympique Marseille',logo: soccerLogo(162),   league: 'Ligue 1',         sport: 'football' },
  { name: 'AS Monaco',          logo: soccerLogo(163),   league: 'Ligue 1',         sport: 'football' },
  // Eredivisie / Portugal
  { name: 'Ajax',               logo: soccerLogo(129),   league: 'Eredivisie',      sport: 'football' },
  { name: 'Benfica',            logo: soccerLogo(143),   league: 'Primeira Liga',   sport: 'football' },
  { name: 'Porto',              logo: soccerLogo(142),   league: 'Primeira Liga',   sport: 'football' },
  // Scottish
  { name: 'Celtic',             logo: soccerLogo(348),   league: 'Scottish Prem',   sport: 'football' },
  { name: 'Rangers',            logo: soccerLogo(349),   league: 'Scottish Prem',   sport: 'football' },
  // NBA
  { name: 'LA Lakers',          logo: nbaLogo('lal'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Golden State Warriors', logo: nbaLogo('gs'), league: 'NBA',             sport: 'basketball' },
  { name: 'Boston Celtics',     logo: nbaLogo('bos'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Miami Heat',         logo: nbaLogo('mia'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Chicago Bulls',      logo: nbaLogo('chi'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Brooklyn Nets',      logo: nbaLogo('bkn'),    league: 'NBA',             sport: 'basketball' },
  { name: 'New York Knicks',    logo: nbaLogo('ny'),     league: 'NBA',             sport: 'basketball' },
  { name: 'Milwaukee Bucks',    logo: nbaLogo('mil'),    league: 'NBA',             sport: 'basketball' },
  { name: 'LA Clippers',        logo: nbaLogo('lac'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Phoenix Suns',       logo: nbaLogo('phx'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Dallas Mavericks',   logo: nbaLogo('dal'),    league: 'NBA',             sport: 'basketball' },
  { name: 'Denver Nuggets',     logo: nbaLogo('den'),    league: 'NBA',             sport: 'basketball' },
]
