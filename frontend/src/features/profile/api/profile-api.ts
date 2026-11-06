import { apiFetch } from '@/lib/api-client'

import type { Profile, ProfileStats, ProfileUpdate } from '../types'

export const profileApi = {
  stats: () => apiFetch<ProfileStats>('/users/me/stats'),
  update: (input: ProfileUpdate) => apiFetch<Profile>('/users/me', { method: 'PATCH', json: input }),
}
