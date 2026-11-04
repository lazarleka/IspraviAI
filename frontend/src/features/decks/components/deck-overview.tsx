import { useNavigate, Link } from 'react-router'
import { Play, Trash2 } from 'lucide-react'

import { SubjectBadge } from '@/components/card/subject-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { useDeck, useDeleteDeck } from '../api/use-decks'
import { GeneratingState } from './generating-state'

type DeckOverviewProps = {
  deckId: number
}

export function DeckOverview({ deckId }: DeckOverviewProps) {
  const deck = useDeck(deckId)
  const deleteDeck = useDeleteDeck()
  const navigate = useNavigate()

  if (deck.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-6 w-24 bg-secondary" />
        <Skeleton className="h-8 w-3/4 bg-secondary" />
        <Skeleton className="h-32 bg-secondary" />
      </div>
    )
  }

  if (deck.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">Ovaj špil ne postoji ili nije tvoj.</p>
        <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
          Nazad na početnu
        </Link>
      </div>
    )
  }

  const data = deck.data

  function onDelete() {
    deleteDeck.mutate(data.id, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SubjectBadge subject={data.subject} className="self-start" />
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-sm text-muted-foreground">
          {data.sourceType === 'file' ? `Iz skripte: ${data.fileName ?? ''}` : `Tema: ${data.topic ?? ''}`}
        </p>
      </div>

      {data.status === 'generating' ? <GeneratingState /> : null}

      {data.status === 'failed' ? (
        <p role="alert" className="rounded-md bg-wrong-surface p-3 text-sm text-wrong-surface-foreground">
          AI nije uspio da napravi kartice iz ovog gradiva. Probaj sa drugom temom ili fajlom.
        </p>
      ) : null}

      {data.status === 'ready' ? (
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Znaš</span>
              <span className="font-heading text-2xl font-bold">{data.progress}%</span>
            </div>
            <Progress value={data.progress} aria-label="Napredak u špilu" />
            <p className="text-xs text-muted-foreground">
              {data.cardCount} kartica · {data.dueCount} za ponavljanje danas
            </p>
          </div>
          <Button asChild size="lg" className="h-12 text-base">
            <Link to={`/study/${data.id}`}>
              <Play className="size-5" aria-hidden="true" />
              Uči
            </Link>
          </Button>
        </>
      ) : null}

      <Button
        variant="ghost"
        className="self-start text-destructive"
        onClick={onDelete}
        disabled={deleteDeck.isPending}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Obriši špil
      </Button>
    </section>
  )
}
