// User and auth payloads, see docs/entities.md ("User").
export type User = {
  id: number
  email: string
  username: string
  displayName: string
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  displayName: string
  username: string
}
