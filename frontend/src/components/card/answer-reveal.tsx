import { FileText, Lightbulb } from 'lucide-react'

import type { CardAnswer } from '@/lib/cards'

type AnswerRevealProps = {
  card: CardAnswer
}

// The explanation under a finished card: why it was wrong (or that it had no error) and the source.
export function AnswerReveal({ card }: AnswerRevealProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          {card.wrongIndex === null ? (
            <strong className="font-semibold">Ova kartica nije imala grešku. </strong>
          ) : null}
          {card.explanation}
        </p>
      </div>
      {card.sourceRef ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="size-3.5" aria-hidden="true" />
          Izvor: {card.sourceRef}
        </p>
      ) : null}
    </div>
  )
}
