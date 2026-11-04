import { apiFetch } from '@/lib/api-client'

import type { AuthResponse, LoginInput, RegisterInput, User } from '../types'

// Real backend: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me.
export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', json: input }),

  login: (input: LoginInput) => apiFetch<AuthResponse>('/auth/login', { method: 'POST', json: input }),

  me: () => apiFetch<User>('/auth/me'),
}
