import type { ReactNode } from 'react'

import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicUser } from '@/lib/users'

import { useFriends } from '../api/use-friends'

type FriendListProps = {
  /** Rendered on the right of every friend, e.g. the "Izazovi" button from matches (passed in by the route). */
  renderAction?: (friend: PublicUser, online: boolean) => ReactNode
}

export function FriendList({ renderAction }: FriendListProps) {
  const friends = useFriends()

  if (friends.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Učitavam prijatelje">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-secondary" />
        ))}
      </div>
    )
  }

  if (friends.isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl bg-secondary p-4">
        <p className="text-sm text-destructive">Ne mogu da učitam prijatelje.</p>
        <Button variant="outline" size="sm" onClick={() => friends.refetch()}>
          Pokušaj ponovo
        </Button>
      </div>
    )
  }

  if (friends.data.items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Još nemaš prijatelja. Pronađi ih po korisničkom imenu i izazovi ih na meč.
      </p>
    )
  }

  // Online friends first: they are the ones you can challenge right now.
  const sorted = [...friends.data.items].sort((a, b) => Number(b.online) - Number(a.online))

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map(({ id, friend, online }) => (
        <li key={id} className="flex min-h-16 items-center gap-3 rounded-xl bg-secondary p-3">
          <UserAvatar name={friend.displayName} online={online} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{friend.displayName}</span>
            <span className="text-xs text-muted-foreground">
              @{friend.username} · {online ? 'online' : 'offline'}
            </span>
          </span>
          {renderAction?.(friend, online)}
        </li>
      ))}
    </ul>
  )
}
