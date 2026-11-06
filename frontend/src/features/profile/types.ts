import type { AvatarColor } from '@/lib/users'

export type Profile = {
  id: number
  email: string
  username: string
  displayName: string
  avatarColor: AvatarColor
  dailyGoal: number
  soundEnabled: boolean
  animationsEnabled: boolean
  createdAt: string
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    'displayName' | 'username' | 'avatarColor' | 'dailyGoal' | 'soundEnabled' | 'animationsEnabled'
  >
>

export type ProfileStats = {
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  totalScore: number
  bestScore: number
  cardsReviewed: number
  correctAnswers: number
  wrongAnswers: number
  accuracy: number
}
