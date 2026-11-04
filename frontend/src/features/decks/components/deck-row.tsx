import { Loader2 } from 'lucide-react'
import { Link } from 'react-router'

import { SubjectIcon } from '@/components/card/subject-badge'
import { SUBJECT_STYLES } from '@/components/card/subject-style'
import { cn } from '@/lib/utils'

import type { Deck } from '../types'

type DeckRowProps = {
  deck: Deck
}

export function DeckRow({ deck }: DeckRowProps) {
  const style = SUBJECT_STYLES[deck.subject]
  const generating = deck.status === 'generating'

  return (
    <Link
      to={`/decks/${deck.id}`}
      className="flex min-h-16 items-center gap-3 rounded-xl bg-secondary p-3 transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
        <SubjectIcon subject={deck.subject} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm font-semibold text-secondary-foreground">{deck.title}</span>
        {generating ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" />
            Pravim kartice…
          </span>
        ) : deck.status === 'failed' ? (
          <span className="text-xs text-destructive">Pravljenje nije uspjelo</span>
        ) : (
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <span
              className={cn('block h-full rounded-full', style.fill)}
              style={{ width: `${deck.progress}%` }}
            />
          </span>
        )}
      </span>
      {deck.status === 'ready' ? (
        <span className={cn('w-10 shrink-0 text-right font-heading text-sm font-bold', style.text)}>
          {deck.progress}%
        </span>
      ) : null}
    </Link>
  )
}
