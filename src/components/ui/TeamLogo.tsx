import { useState } from 'react'

const COUNTRY_ISO: Record<string, string> = {
  'England': 'gb-eng', 'Germany': 'de', 'Brazil': 'br', 'Argentina': 'ar',
  'France': 'fr', 'Spain': 'es', 'Italy': 'it', 'Portugal': 'pt',
  'Netherlands': 'nl', 'Belgium': 'be', 'United States': 'us', 'USA': 'us',
  'Nigeria': 'ng', 'Ghana': 'gh', 'Mexico': 'mx', 'Japan': 'jp',
  'South Korea': 'kr', 'Australia': 'au', 'Senegal': 'sn', 'Morocco': 'ma',
  'Egypt': 'eg', 'Colombia': 'co', 'Uruguay': 'uy', 'Chile': 'cl',
  'Ecuador': 'ec', 'Peru': 'pe', 'Costa Rica': 'cr', 'Panama': 'pa',
  'Turkey': 'tr', 'Greece': 'gr', 'Croatia': 'hr', 'Switzerland': 'ch',
  'Austria': 'at', 'Sweden': 'se', 'Denmark': 'dk', 'Norway': 'no',
  'Scotland': 'gb-sct', 'Wales': 'gb-wls', 'Ireland': 'ie', 'Serbia': 'rs',
  'Ukraine': 'ua', 'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu',
  'Romania': 'ro', 'Slovakia': 'sk', 'Slovenia': 'si', 'Iceland': 'is',
  'Finland': 'fi', 'Georgia': 'ge', 'Albania': 'al', 'Cameroon': 'cm',
  "Ivory Coast": 'ci', 'Tunisia': 'tn', 'Algeria': 'dz', 'South Africa': 'za',
  'Kenya': 'ke', 'Tanzania': 'tz', 'Saudi Arabia': 'sa', 'Iran': 'ir',
  'Qatar': 'qa', 'China': 'cn', 'Canada': 'ca', 'Jamaica': 'jm',
  'Bolivia': 'bo', 'Paraguay': 'py', 'Lithuania': 'lt', 'Latvia': 'lv',
  'Estonia': 'ee', 'Belarus': 'by', 'North Macedonia': 'mk', 'Montenegro': 'me',
  'Bosnia': 'ba', 'Bosnia and Herzegovina': 'ba', 'Kosovo': 'xk',
  'Luxembourg': 'lu', 'Malta': 'mt', 'Cyprus': 'cy', 'Macau': 'mo',
  'Macao': 'mo', 'Honduras': 'hn', 'El Salvador': 'sv', 'Guatemala': 'gt',
  'Venezuela': 've', 'Russia': 'ru', 'Israel': 'il', 'Uzbekistan': 'uz',
  'Kazakhstan': 'kz', 'United Arab Emirates': 'ae', 'New Zealand': 'nz',
  'Indonesia': 'id', 'Thailand': 'th', 'Vietnam': 'vn', 'Philippines': 'ph',
  'India': 'in', 'Pakistan': 'pk', 'Bangladesh': 'bd', 'Iraq': 'iq',
}

const BADGE_COLORS = [
  { bg: '#1e3a5f', border: '#2563eb', text: '#93c5fd' },
  { bg: '#1a3a2a', border: '#16a34a', text: '#86efac' },
  { bg: '#3b1f1f', border: '#dc2626', text: '#fca5a5' },
  { bg: '#2d1f3d', border: '#7c3aed', text: '#c4b5fd' },
  { bg: '#2d2010', border: '#d97706', text: '#fcd34d' },
  { bg: '#1a2e3b', border: '#0891b2', text: '#67e8f9' },
  { bg: '#2a1f30', border: '#db2777', text: '#f9a8d4' },
  { bg: '#1f2f1a', border: '#65a30d', text: '#bef264' },
  { bg: '#2a2010', border: '#ea580c', text: '#fdba74' },
  { bg: '#1a1f3b', border: '#4f46e5', text: '#a5b4fc' },
]

function nameHash(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase()
}

const SIZES: Record<string, { px: number; font: string }> = {
  xs: { px: 24, font: '10px' },
  sm: { px: 32, font: '11px' },
  md: { px: 48, font: '13px' },
  lg: { px: 64, font: '16px' },
  xl: { px: 80, font: '20px' },
}

interface TeamLogoProps {
  name: string
  logo?: string           // stored ESPN URL (most reliable)
  teamId?: string         // ESPN numeric team ID — used to construct CDN URL
  sport?: 'football' | 'basketball'
  emoji?: string
  size?: keyof typeof SIZES
  className?: string
}

function buildEspnUrl(teamId: string, sport: 'football' | 'basketball'): string {
  const section = sport === 'basketball' ? 'nba' : 'soccer'
  return `https://a.espncdn.com/i/teamlogos/${section}/500/${teamId}.png`
}

export default function TeamLogo({
  name, logo, teamId, sport = 'football', emoji: _emoji, size = 'md', className = '',
}: TeamLogoProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const [espnFailed, setEspnFailed] = useState(false)
  const [flagFailed, setFlagFailed] = useState(false)

  const { px, font } = SIZES[size] ?? SIZES.md
  const flagUrl = COUNTRY_ISO[name] ? `https://flagcdn.com/w80/${COUNTRY_ISO[name]}.png` : null
  const espnUrl = teamId ? buildEspnUrl(teamId, sport) : null
  const color = BADGE_COLORS[nameHash(name) % BADGE_COLORS.length]

  const circleStyle: React.CSSProperties = {
    width: px, height: px, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' as const,
  }

  // 1. Stored logo (already fetched from ESPN at bet creation time)
  if (logo && !logoFailed) {
    return (
      <img src={logo} alt={name} style={circleStyle}
        className={`bg-slate-800 ${className}`} onError={() => setLogoFailed(true)} />
    )
  }

  // 2. Construct ESPN CDN URL from stored teamId (works for all clubs + national teams)
  if (espnUrl && !espnFailed) {
    return (
      <img src={espnUrl} alt={name} style={circleStyle}
        className={`bg-slate-800 ${className}`} onError={() => setEspnFailed(true)} />
    )
  }

  // 3. Country flag from flagcdn.com (national teams on old bets without teamId)
  if (flagUrl && !flagFailed) {
    return (
      <img src={flagUrl} alt={name} style={circleStyle}
        className={`bg-slate-800 ${className}`} onError={() => setFlagFailed(true)} />
    )
  }

  // 4. Colored initials badge
  return (
    <div
      style={{
        ...circleStyle,
        background: color.bg,
        border: `1.5px solid ${color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: font, color: color.text,
        letterSpacing: '0.05em', userSelect: 'none' as const,
      }}
      className={className}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
