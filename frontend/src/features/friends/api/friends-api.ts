import { apiFetch, type Page } from '@/lib/api-client'
import type { PublicUser } from '@/lib/users'

import type { FriendRequests, Friendship } from '../types'

export const friendsApi = {
  searchUsers: (search: string) =>
    apiFetch<Page<PublicUser>>(`/users?search=${encodeURIComponent(search.trim())}`),
  list: () => apiFetch<Page<Friendship>>('/friends'),
  requests: () => apiFetch<FriendRequests>('/friends/requests'),
  sendRequest: (username: string) =>
    apiFetch<Friendship>('/friends/requests', { method: 'POST', json: { username } }),
  accept: (id: number) =>
    apiFetch<Friendship>(`/friends/requests/${id}/accept`, { method: 'POST' }),
  remove: (id: number) => apiFetch<void>(`/friends/${id}`, { method: 'DELETE' }),
}
