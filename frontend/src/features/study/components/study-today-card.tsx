import { Flame } from 'lucide-react'
import { Link } from 'react-router'

import { Skeleton } from '@/components/ui/skeleton'

import { useStudyToday } from '../api/use-study'

// The block on top of the home screen: how many cards are due today, and a shortcut to the first deck.
export function StudyTodayCard() {
  const today = useStudyToday()

  if (today.isPending) return <Skeleton className="h-28 rounded-xl bg-secondary" />
  if (today.isError) return null

  const firstDue = today.data.decks.find((d) => d.dueCount > 0)
  const count = today.data.dueCount
  const label = count === 1 ? 'kartica' : count >= 2 && count <= 4 ? 'kartice' : 'kartica'

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary p-5 text-secondary-foreground lg:p-6">
      <div>
        <p className="text-sm text-muted-foreground">Danas za ponavljanje</p>
        <p className="font-heading text-3xl font-bold text-foreground">
          {count} {label}
        </p>
        {count === 0 ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="size-3.5" aria-hidden="true" />
            Sve je ponovljeno za danas
          </p>
        ) : null}
      </div>
      {firstDue ? (
        <Link
          to={`/study/${firstDue.deckId}`}
          className="flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Kreni
        </Link>
      ) : null}
    </div>
  )
}
