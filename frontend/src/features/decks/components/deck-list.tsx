import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useDecks } from '../api/use-decks'
import { AddDeckDialog } from './add-deck-dialog'
import { DeckRow } from './deck-row'

export function DeckList() {
  const decks = useDecks()

  if (decks.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Učitavam špilove">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-secondary" />
        ))}
      </div>
    )
  }

  if (decks.isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl bg-secondary p-4">
        <p className="text-sm text-destructive">Ne mogu da učitam špilove. {decks.error.message}</p>
        <Button variant="outline" size="sm" onClick={() => decks.refetch()}>
          Pokušaj ponovo
        </Button>
      </div>
    )
  }

  if (decks.data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-secondary p-6 text-center">
        <p className="font-semibold">Napravi svoje prve kartice</p>
        <p className="text-sm text-muted-foreground">
          Unesi temu ili ubaci skriptu, a AI napravi kartice sa greškama.
        </p>
        <AddDeckDialog variant="button" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {decks.data.items.map((deck) => (
          <li key={deck.id}>
            <DeckRow deck={deck} />
          </li>
        ))}
      </ul>
      <AddDeckDialog />
    </div>
  )
}
