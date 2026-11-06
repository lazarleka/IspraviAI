import { ChevronRight, Minus, Trophy, X } from 'lucide-react'
import { Link } from 'react-router'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'

import { useMatches } from '../api/use-matches'
import type { Match } from '../types'

export function MatchHistory({ userId }: { userId: number }) {
  const matches = useMatches()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Posljednji mečevi</h2>
      {matches.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 bg-secondary" />
          <Skeleton className="h-20 bg-secondary" />
        </div>
      ) : matches.isError ? (
        <Card className="border-profile-card-border bg-profile-card px-4 py-5 text-sm text-profile-card-foreground">
          Istorija mečeva trenutno nije dostupna.
        </Card>
      ) : matches.data.items.length === 0 ? (
        <Card className="border-profile-card-border bg-profile-card px-5 py-6 text-center text-profile-card-foreground">
          <Trophy className="mx-auto size-7 text-profile-card-accent" aria-hidden="true" />
          <p className="mt-2 font-semibold">Još nema odigranih mečeva</p>
          <p className="text-sm text-profile-card-muted">
            Izazovi prijatelja i prvi rezultat će se pojaviti ovdje.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.data.items.slice(0, 5).map((match) => (
            <MatchRow key={match.id} match={match} userId={userId} />
          ))}
        </div>
      )}
    </section>
  )
}

function MatchRow({ match, userId }: { match: Match; userId: number }) {
  const isFirst = match.player1.id === userId
  const opponent = isFirst ? match.player2 : match.player1
  const ownScore = isFirst ? match.player1Score : match.player2Score
  const opponentScore = isFirst ? match.player2Score : match.player1Score
  const won = match.winnerId === userId
  const draw = match.winnerId === null
  const ResultIcon = draw ? Minus : won ? Trophy : X

  return (
    <Link
      to={`/match/${match.id}/result`}
      className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="flex-row items-center gap-3 border-profile-card-border bg-profile-card px-4 py-3 text-profile-card-foreground transition-colors hover:bg-profile-card/90">
        <UserAvatar name={opponent.displayName} color="amber" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{opponent.displayName}</p>
          <p className="truncate text-xs text-profile-card-muted">{match.topic}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'flex items-center justify-end gap-1 text-sm font-bold',
              won ? 'text-profile-card-accent' : draw ? 'text-profile-card-muted' : 'text-destructive',
            )}
          >
            <ResultIcon className="size-4" aria-hidden="true" />
            {draw ? 'Neriješeno' : won ? 'Pobjeda' : 'Poraz'}
          </p>
          <p className="text-xs text-profile-card-muted">
            {ownScore} : {opponentScore}
          </p>
        </div>
        <ChevronRight className="size-4 text-profile-card-accent" aria-hidden="true" />
      </Card>
    </Link>
  )
}
