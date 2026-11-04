import { CircleCheck, CircleX, RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'

type ResultBannerProps =
  { kind: 'retry' } | { kind: 'result'; correct: boolean; points: number; firstTry: boolean }

export function ResultBanner(props: ResultBannerProps) {
  if (props.kind === 'retry') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl bg-wrong-surface p-3 text-wrong-surface-foreground"
      >
        <RotateCcw className="size-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">Nije to. Imaš još jedan pokušaj.</p>
      </div>
    )
  }

  const { correct, points, firstTry } = props
  const Icon = correct ? CircleCheck : CircleX
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-xl p-3',
        correct
          ? 'bg-success-surface text-success-surface-foreground'
          : 'bg-wrong-surface text-wrong-surface-foreground',
      )}
    >
      <Icon className="size-6 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {correct ? 'Tačno, uhvatio si ga!' : 'Promašaj. Evo gdje je bila greška.'}
        </p>
        <p className="text-xs">
          {correct ? (firstTry ? 'Iz prvog pokušaja' : 'Iz drugog pokušaja') : 'Ova kartica se vraća uskoro'}
        </p>
      </div>
      <span className="font-heading text-lg font-bold">+{points}</span>
    </div>
  )
}
