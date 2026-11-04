import { Check, X } from 'lucide-react'

import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'

import { useAcceptFriendRequest, useFriendRequests, useRemoveFriendship } from '../api/use-friends'

export function RequestList() {
  const requests = useFriendRequests()
  const accept = useAcceptFriendRequest()
  const remove = useRemoveFriendship()

  if (requests.isPending || requests.isError) return null
  const { incoming, outgoing } = requests.data
  if (incoming.length === 0 && outgoing.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Zahtjevi</h2>
      <ul className="flex flex-col gap-2">
        {incoming.map((request) => (
          <li
            key={request.id}
            className="flex items-center gap-3 rounded-xl border border-primary bg-secondary p-3"
          >
            <UserAvatar name={request.friend.displayName} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{request.friend.displayName}</span>
              <span className="text-xs text-muted-foreground">želi da budete prijatelji</span>
            </span>
            <Button
              size="icon"
              aria-label={`Prihvati ${request.friend.displayName}`}
              disabled={accept.isPending}
              onClick={() => accept.mutate(request.id)}
            >
              <Check className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Odbij ${request.friend.displayName}`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(request.id)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
        {outgoing.map((request) => (
          <li key={request.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <UserAvatar name={request.friend.displayName} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{request.friend.displayName}</span>
              <span className="text-xs text-muted-foreground">čeka odgovor</span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate(request.id)}
            >
              Otkaži
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
