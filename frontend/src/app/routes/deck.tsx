import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { DeckOverview } from '@/features/decks/components/deck-overview'

export function DeckPage() {
  const { deckId } = useParams()

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Špilovi
      </Link>
      <DeckOverview deckId={Number(deckId)} />
    </div>
  )
}
