// User and auth payloads, see docs/entities.md ("User").
import type { AvatarColor } from '@/lib/users'

export type User = {
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

export type AuthResponse = {
  token: string
  user: User
}

export type LoginInput = {
  identifier: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  displayName: string
  username: string
}
