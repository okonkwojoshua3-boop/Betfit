import type { Punishment } from '../types'

export const PUNISHMENTS: Punishment[] = [
  { id: 'pushups', name: 'Push-ups', emoji: '💪', defaultReps: 20, isTimeBased: false },
  { id: 'burpees', name: 'Burpees', emoji: '🔥', defaultReps: 15, isTimeBased: false },
  { id: 'squats', name: 'Squats', emoji: '🦵', defaultReps: 30, isTimeBased: false },
  { id: 'lunges', name: 'Lunges', emoji: '🏃', defaultReps: 20, isTimeBased: false },
  { id: 'situps', name: 'Sit-ups', emoji: '🤸', defaultReps: 25, isTimeBased: false },
  { id: 'jumpingjacks', name: 'Jumping Jacks', emoji: '⚡', defaultReps: 40, isTimeBased: false },
  { id: 'plank', name: 'Plank', emoji: '🧱', defaultReps: 60, isTimeBased: true },
  { id: 'mountainclimbers', name: 'Mountain Climbers', emoji: '🏔️', defaultReps: 30, isTimeBased: false },
]

export function getPunishmentById(id: string): Punishment | undefined {
  return PUNISHMENTS.find((p) => p.id === id)
}

export function formatPunishment(punishment: Punishment, reps: number): string {
  if (punishment.isTimeBased) {
    return `${reps} second${reps !== 1 ? 's' : ''} of ${punishment.name}`
  }
  return `${reps} ${punishment.name}`
}
