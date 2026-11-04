import { cn } from '@/lib/utils'

type ChoiceChipsProps<T extends string | number> = {
  label: string
  options: readonly T[]
  value: T | undefined
  onChange: (value: T) => void
  format?: (value: T) => string
}

// A row of pill buttons for one choice (card count, subject). Used by decks and matches.
export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format,
}: ChoiceChipsProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selected
                  ? 'border-primary bg-primary font-semibold text-primary-foreground'
                  : 'border-border bg-secondary text-secondary-foreground hover:border-primary',
              )}
            >
              {format ? format(option) : option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
