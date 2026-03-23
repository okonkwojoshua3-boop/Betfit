import type { Sport } from '../../types'

export default function SportIcon({ sport, size = 'md' }: { sport: Sport; size?: 'sm' | 'md' | 'lg' }) {
  const emoji = sport === 'football' ? '⚽' : '🏀'
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-3xl' : 'text-xl'
  return <span className={sizeClass}>{emoji}</span>
}
