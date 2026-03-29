import { useState } from 'react'

// ISO 3166-1 alpha-2 codes for national teams (flagcdn.com)
const COUNTRY_ISO: Record<string, string> = {
  'England': 'gb-eng',
  'Germany': 'de',
  'Brazil': 'br',
  'Argentina': 'ar',
  'France': 'fr',
  'Spain': 'es',
  'Italy': 'it',
  'Portugal': 'pt',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'United States': 'us',
  'USA': 'us',
  'Nigeria': 'ng',
  'Ghana': 'gh',
  'Mexico': 'mx',
  'Japan': 'jp',
  'South Korea': 'kr',
  'Australia': 'au',
  'Senegal': 'sn',
  'Morocco': 'ma',
  'Egypt': 'eg',
  'Colombia': 'co',
  'Uruguay': 'uy',
  'Chile': 'cl',
  'Ecuador': 'ec',
  'Peru': 'pe',
  'Costa Rica': 'cr',
  'Panama': 'pa',
  'Turkey': 'tr',
  'Greece': 'gr',
  'Croatia': 'hr',
  'Switzerland': 'ch',
  'Austria': 'at',
  'Sweden': 'se',
  'Denmark': 'dk',
  'Norway': 'no',
  'Scotland': 'gb-sct',
  'Wales': 'gb-wls',
  'Ireland': 'ie',
  'Serbia': 'rs',
  'Ukraine': 'ua',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Hungary': 'hu',
  'Romania': 'ro',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'Iceland': 'is',
  'Finland': 'fi',
  'Georgia': 'ge',
  'Albania': 'al',
  'Cameroon': 'cm',
  "Ivory Coast": 'ci',
  'Tunisia': 'tn',
  'Algeria': 'dz',
  'South Africa': 'za',
  'Kenya': 'ke',
  'Tanzania': 'tz',
  'Saudi Arabia': 'sa',
  'Iran': 'ir',
  'Qatar': 'qa',
  'China': 'cn',
  'Canada': 'ca',
  'Jamaica': 'jm',
  'Bolivia': 'bo',
  'Paraguay': 'py',
  'Lithuania': 'lt',
  'Latvia': 'lv',
  'Estonia': 'ee',
  'Belarus': 'by',
  'North Macedonia': 'mk',
  'Montenegro': 'me',
  'Bosnia': 'ba',
  'Bosnia and Herzegovina': 'ba',
  'Kosovo': 'xk',
  'Luxembourg': 'lu',
  'Malta': 'mt',
  'Cyprus': 'cy',
  'Macau': 'mo',
  'Macao': 'mo',
  'Honduras': 'hn',
  'El Salvador': 'sv',
  'Guatemala': 'gt',
  'Venezuela': 've',
  'Russia': 'ru',
  'Israel': 'il',
  'Uzbekistan': 'uz',
  'Kazakhstan': 'kz',
  'United Arab Emirates': 'ae',
  'Bahrain': 'bh',
  'Oman': 'om',
  'Kuwait': 'kw',
  'Iraq': 'iq',
  'New Zealand': 'nz',
  'Indonesia': 'id',
  'Thailand': 'th',
  'Vietnam': 'vn',
  'Philippines': 'ph',
  'India': 'in',
  'Pakistan': 'pk',
  'Bangladesh': 'bd',
}

// Vibrant palette for initials badges — deterministic per team name
const BADGE_COLORS = [
  { bg: '#1e3a5f', border: '#2563eb', text: '#93c5fd' }, // blue
  { bg: '#1a3a2a', border: '#16a34a', text: '#86efac' }, // green
  { bg: '#3b1f1f', border: '#dc2626', text: '#fca5a5' }, // red
  { bg: '#2d1f3d', border: '#7c3aed', text: '#c4b5fd' }, // purple
  { bg: '#2d2010', border: '#d97706', text: '#fcd34d' }, // amber
  { bg: '#1a2e3b', border: '#0891b2', text: '#67e8f9' }, // cyan
  { bg: '#2a1f30', border: '#db2777', text: '#f9a8d4' }, // pink
  { bg: '#1f2f1a', border: '#65a30d', text: '#bef264' }, // lime
  { bg: '#2a2010', border: '#ea580c', text: '#fdba74' }, // orange
  { bg: '#1a1f3b', border: '#4f46e5', text: '#a5b4fc' }, // indigo
]

function nameHash(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h
}

function getBadgeColor(name: string) {
  return BADGE_COLORS[nameHash(name) % BADGE_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function getFlagUrl(name: string): string | null {
  const code = COUNTRY_ISO[name]
  if (!code) return null
  return `https://flagcdn.com/w80/${code}.png`
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
  logo?: string
  emoji?: string
  size?: keyof typeof SIZES
  className?: string
}

export default function TeamLogo({ name, logo, emoji: _emoji, size = 'md', className = '' }: TeamLogoProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const [flagFailed, setFlagFailed] = useState(false)

  const { px, font } = SIZES[size] ?? SIZES.md
  const flagUrl = getFlagUrl(name)
  const color = getBadgeColor(name)

  const circleStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover' as const,
  }

  // 1. Try ESPN/stored logo
  if (logo && !logoFailed) {
    return (
      <img
        src={logo}
        alt={name}
        style={circleStyle}
        className={`bg-slate-800 ${className}`}
        onError={() => setLogoFailed(true)}
      />
    )
  }

  // 2. Try flagcdn.com for national teams
  if (flagUrl && !flagFailed) {
    return (
      <img
        src={flagUrl}
        alt={name}
        style={circleStyle}
        className={`bg-slate-800 ${className}`}
        onError={() => setFlagFailed(true)}
      />
    )
  }

  // 3. Initials badge with team-specific color
  const initials = getInitials(name)
  return (
    <div
      style={{
        ...circleStyle,
        background: color.bg,
        border: `1.5px solid ${color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: font,
        color: color.text,
        letterSpacing: '0.05em',
        userSelect: 'none',
      }}
      className={className}
      title={name}
    >
      {initials}
    </div>
  )
}
