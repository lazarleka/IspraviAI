import { cva } from 'class-variance-authority'

import type { CardQuestion } from '@/lib/cards'
import type { Subject } from '@/lib/subjects'
import { cn } from '@/lib/utils'

import { SUBJECT_STYLES } from './subject-style'

export type CardReveal = {
  wrongIndex: number | null
  correctText: string | null
}

type SegmentState = 'idle' | 'selected' | 'locked' | 'wrong'

const textSegment = cva(
  'rounded-sm px-1 py-0.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  {
    variants: {
      state: {
        idle: 'enabled:underline enabled:decoration-border enabled:decoration-dotted enabled:underline-offset-[6px] enabled:hover:bg-accent/40',
        selected: 'marker motion-safe:animate-marker',
        locked: 'text-destructive line-through decoration-2',
        wrong: 'bg-wrong-surface text-wrong-surface-foreground line-through decoration-2',
      },
    },
  },
)

const codeLine = cva(
  'flex w-full gap-3 rounded-sm px-2 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  {
    variants: {
      state: {
        idle: 'enabled:hover:bg-foreground/10',
        selected: 'marker motion-safe:animate-marker',
        locked: 'text-destructive line-through',
        wrong: 'bg-wrong-surface text-wrong-surface-foreground line-through',
      },
    },
  },
)

type SegmentCardProps = {
  card: CardQuestion
  subject: Subject
  selectedIndex: number | null
  /** Segments already tried and wrong (first attempt); they cannot be picked again. */
  lockedIndexes?: number[]
  /** Set after the card ended: strikes the wrong segment and shows the correction. */
  reveal?: CardReveal | null
  disabled?: boolean
  /** Change this value to shake the card once (a wrong answer). */
  shakeKey?: number
  onSelect?: (index: number) => void
}

// The white card with tappable segments. Used by study and by the PvP match.
export function SegmentCard({
  card,
  subject,
  selectedIndex,
  lockedIndexes = [],
  reveal = null,
  disabled = false,
  shakeKey = 0,
  onSelect,
}: SegmentCardProps) {
  const isRevealed = reveal !== null

  function stateOf(index: number): SegmentState {
    if (isRevealed) return reveal.wrongIndex === index ? 'wrong' : 'idle'
    if (lockedIndexes.includes(index)) return 'locked'
    if (!isRevealed && selectedIndex === index) return 'selected'
    return 'idle'
  }

  function isDisabled(index: number) {
    return disabled || isRevealed || lockedIndexes.includes(index)
  }

  const correction = isRevealed && reveal.correctText !== null ? reveal.correctText : null

  return (
    <div
      key={shakeKey}
      className={cn(
        'rounded-b-xl border-t-4 bg-card p-4 text-card-foreground',
        SUBJECT_STYLES[subject].stripe,
        shakeKey > 0 && 'motion-safe:animate-shake',
      )}
    >
      {card.kind === 'code' ? (
        <div className="overflow-x-auto rounded-lg bg-code py-2 font-mono text-sm text-code-foreground">
          {card.segments.map((segment, index) => (
            <div key={index}>
              <button
                type="button"
                className={codeLine({ state: stateOf(index) })}
                disabled={isDisabled(index)}
                aria-pressed={selectedIndex === index}
                onClick={() => onSelect?.(index)}
              >
                <span className="w-5 shrink-0 text-right opacity-50 select-none" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="whitespace-pre">{segment}</span>
              </button>
              {correction !== null && reveal?.wrongIndex === index ? (
                <p className="mx-2 flex gap-3 rounded-sm bg-success-surface px-2 py-1 text-success-surface-foreground">
                  <span className="w-5 shrink-0 text-right opacity-50 select-none" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre">{correction}</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-lg leading-9">
          {card.segments.map((segment, index) => (
            <span key={index}>
              <button
                type="button"
                className={textSegment({ state: stateOf(index) })}
                disabled={isDisabled(index)}
                aria-pressed={selectedIndex === index}
                onClick={() => onSelect?.(index)}
              >
                {segment}
              </button>
              {correction !== null && reveal?.wrongIndex === index ? (
                <span className="ml-1 rounded-sm bg-success-surface px-1 py-0.5 text-success-surface-foreground">
                  {correction}
                </span>
              ) : null}{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
