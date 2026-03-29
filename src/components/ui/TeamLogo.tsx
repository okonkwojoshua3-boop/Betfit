import { useState } from 'react'

// ISO 3166-1 alpha-2 codes for national teams (flagcdn.com uses these)
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

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-20 h-20 text-lg',
}

interface TeamLogoProps {
  name: string
  logo?: string
  emoji?: string
  size?: keyof typeof SIZES
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
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

export default function TeamLogo({ name, logo, emoji, size = 'md', className = '' }: TeamLogoProps) {
  const [logoFailed, setLogoFailed] = useState(false)
  const [flagFailed, setFlagFailed] = useState(false)

  const sizeClass = SIZES[size]
  const flagUrl = getFlagUrl(name)

  // 1. Try ESPN/stored logo
  if (logo && !logoFailed) {
    return (
      <img
        src={logo}
        alt={name}
        className={`${sizeClass} rounded-full object-cover bg-slate-700 flex-shrink-0 ${className}`}
        onError={() => setLogoFailed(true)}
      />
    )
  }

  // 2. Try country flag for national teams
  if (flagUrl && !flagFailed) {
    return (
      <img
        src={flagUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover bg-slate-700 flex-shrink-0 ${className}`}
        onError={() => setFlagFailed(true)}
      />
    )
  }

  // 3. Initials badge fallback
  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-700 border border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
    >
      {emoji ?? getInitials(name)}
    </div>
  )
}
