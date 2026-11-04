import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'

import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useSendFriendRequest, useUserSearch } from '../api/use-friends'

export function UserSearch() {
  const [search, setSearch] = useState('')
  const results = useUserSearch(search)
  const sendRequest = useSendFriendRequest()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const showResults = search.trim().length >= 2

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          aria-label="Pretraži po korisničkom imenu"
          placeholder="Pretraži po korisničkom imenu"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            sendRequest.reset()
            setSentTo(null)
          }}
          autoCapitalize="none"
          className="h-11 bg-secondary pl-9"
        />
      </div>

      {sendRequest.error ? (
        <p role="alert" className="text-sm text-destructive">
          {sendRequest.error.message}
        </p>
      ) : null}

      {showResults ? (
        results.isPending ? (
          <p className="text-sm text-muted-foreground">Tražim…</p>
        ) : results.isError ? (
          <p className="text-sm text-destructive">Pretraga nije uspjela.</p>
        ) : results.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema korisnika sa tim imenom.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.data.items.map((user) => (
              <li key={user.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <UserAvatar name={user.displayName} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </span>
                {sentTo === user.username ? (
                  <span className="text-xs text-success">Poslato</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    disabled={sendRequest.isPending}
                    onClick={() =>
                      sendRequest.mutate(user.username, { onSuccess: () => setSentTo(user.username) })
                    }
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    Dodaj
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  )
}
