// MOCK until the backend has /api/friends and /api/users. Matches docs/entities.md ("Friendship").
// The signed-in user is id 1 in the mock.
import { ApiError, type Page } from '@/lib/api-client'
import { delay } from '@/lib/mock-db'
import type { PublicUser } from '@/lib/users'

import type { FriendRequests, Friendship } from '../types'

const ME = 1

const users: PublicUser[] = [
  { id: 2, username: 'marko_v', displayName: 'Marko Vuković' },
  { id: 3, username: 'jelena', displayName: 'Jelena Đurović' },
  { id: 4, username: 'nikola_r', displayName: 'Nikola Radonjić' },
  { id: 5, username: 'ana_p', displayName: 'Ana Petrović' },
  { id: 6, username: 'stefan99', displayName: 'Stefan Marković' },
  { id: 7, username: 'milica_b', displayName: 'Milica Bulatović' },
  { id: 8, username: 'luka', displayName: 'Luka Popović' },
  { id: 9, username: 'marija_k', displayName: 'Marija Kovačević' },
]

const online = new Set([2, 3, 5])

type Row = {
  id: number
  userId: number
  requestedById: number
  status: Friendship['status']
  createdAt: string
  acceptedAt: string | null
}

let rows: Row[] = [
  {
    id: 1,
    userId: 2,
    requestedById: ME,
    status: 'accepted',
    createdAt: '2026-10-20T10:00:00Z',
    acceptedAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 2,
    userId: 3,
    requestedById: 3,
    status: 'accepted',
    createdAt: '2026-10-22T09:00:00Z',
    acceptedAt: '2026-10-22T09:30:00Z',
  },
  {
    id: 3,
    userId: 4,
    requestedById: ME,
    status: 'accepted',
    createdAt: '2026-10-25T18:00:00Z',
    acceptedAt: '2026-10-26T08:00:00Z',
  },
  {
    id: 4,
    userId: 5,
    requestedById: 5,
    status: 'pending',
    createdAt: '2026-11-03T17:00:00Z',
    acceptedAt: null,
  },
  {
    id: 5,
    userId: 6,
    requestedById: ME,
    status: 'pending',
    createdAt: '2026-11-02T12:00:00Z',
    acceptedAt: null,
  },
]

function toFriendship(row: Row): Friendship {
  const friend = users.find((u) => u.id === row.userId)
  if (!friend) throw new Error(`Mock user ${row.userId} is missing`)
  return {
    id: row.id,
    requestedById: row.requestedById,
    status: row.status,
    friend,
    online: online.has(row.userId),
    createdAt: row.createdAt,
    acceptedAt: row.acceptedAt,
  }
}

export const friendsApi = {
  searchUsers: (search: string): Promise<Page<PublicUser>> => {
    const q = search.trim().toLowerCase()
    const items = q.length < 2 ? [] : users.filter((u) => u.username.startsWith(q))
    return delay({ total: items.length, items, pages: 1 })
  },

  list: (): Promise<Page<Friendship>> => {
    const items = rows.filter((r) => r.status === 'accepted').map(toFriendship)
    return delay({ total: items.length, items, pages: 1 })
  },

  requests: (): Promise<FriendRequests> => {
    const pending = rows.filter((r) => r.status === 'pending')
    return delay({
      incoming: pending.filter((r) => r.requestedById !== ME).map(toFriendship),
      outgoing: pending.filter((r) => r.requestedById === ME).map(toFriendship),
    })
  },

  sendRequest: (username: string) => {
    const user = users.find((u) => u.username === username.trim().toLowerCase())
    if (!user) return Promise.reject(new ApiError(404, 'Korisnik ne postoji.', 'user_not_found'))
    const existing = rows.find((r) => r.userId === user.id)
    if (existing?.status === 'accepted') {
      return Promise.reject(new ApiError(409, 'Već ste prijatelji.', 'already_friends'))
    }
    if (existing) return Promise.reject(new ApiError(409, 'Zahtjev je već poslat.', 'request_already_sent'))
    const row: Row = {
      id: Date.now(),
      userId: user.id,
      requestedById: ME,
      status: 'pending',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    }
    rows = [...rows, row]
    return delay(toFriendship(row))
  },

  accept: (id: number) => {
    const row = rows.find((r) => r.id === id)
    if (!row) return Promise.reject(new ApiError(404, 'Zahtjev ne postoji.', 'friendship_not_found'))
    rows = rows.map((r) =>
      r.id === id ? { ...r, status: 'accepted', acceptedAt: new Date().toISOString() } : r,
    )
    return delay(toFriendship({ ...row, status: 'accepted' }))
  },

  remove: (id: number) => {
    rows = rows.filter((r) => r.id !== id)
    return delay(undefined)
  },
}
