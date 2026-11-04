import { Link, useParams } from 'react-router'

import { Skeleton } from '@/components/ui/skeleton'
import { useDeck } from '@/features/decks/api/use-decks'
import { StudySession } from '@/features/study/components/study-session'

// Combines decks (title, subject, status) and study (the session itself).
export function StudyPage() {
  const { deckId } = useParams()
  const id = Number(deckId)
  const deck = useDeck(id)

  if (deck.isPending) return <Skeleton className="h-64 bg-secondary" />

  if (deck.isError || deck.data.status !== 'ready') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          {deck.isError ? 'Ovaj špil ne postoji.' : 'Kartice za ovaj špil još nisu spremne.'}
        </p>
        <Link
          to={deck.isError ? '/' : `/decks/${id}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Nazad
        </Link>
      </div>
    )
  }

  return <StudySession deckId={id} subject={deck.data.subject} />
}
