// Friendship, see docs/entities.md ("Friendship").
import type { PublicUser } from '@/lib/users'

export type FriendshipStatus = 'pending' | 'accepted'

export type Friendship = {
  id: number
  requestedById: number
  status: FriendshipStatus
  friend: PublicUser
  online: boolean
  createdAt: string
  acceptedAt: string | null
}

export type FriendRequests = {
  incoming: Friendship[]
  outgoing: Friendship[]
}
