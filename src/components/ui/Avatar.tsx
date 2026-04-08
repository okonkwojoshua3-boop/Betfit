interface AvatarProps {
  url?: string | null
  username: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  xs: { outer: 'w-5 h-5',   text: 'text-[9px]'  },
  sm: { outer: 'w-7 h-7',   text: 'text-[11px]' },
  md: { outer: 'w-9 h-9',   text: 'text-sm'     },
  lg: { outer: 'w-14 h-14', text: 'text-xl'     },
  xl: { outer: 'w-20 h-20', text: 'text-3xl'    },
}

export default function Avatar({ url, username, size = 'md', className = '' }: AvatarProps) {
  const { outer, text } = SIZE_MAP[size]
  const initial = username ? username[0].toUpperCase() : '?'

  if (url) {
    return (
      <img
        src={url}
        alt={username}
        className={`${outer} rounded-full object-cover shrink-0 ${className}`}
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      />
    )
  }

  return (
    <div
      className={`${outer} rounded-full flex items-center justify-center font-display font-bold shrink-0 ${text} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1A2840, #111D30)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#E8EDF5',
      }}
    >
      {initial}
    </div>
  )
}
