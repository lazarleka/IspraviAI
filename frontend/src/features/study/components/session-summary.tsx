import { Trophy } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

import type { SessionTotals } from '../hooks/use-study-session'

type SessionSummaryProps = {
  totals: SessionTotals
  total: number
  onRestart: () => void
}

export function SessionSummary({ totals, total, onRestart }: SessionSummaryProps) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-secondary p-6 text-center">
        <p className="font-semibold">Nema kartica za ovaj špil.</p>
        <Button asChild variant="outline">
          <Link to="/">Nazad na početnu</Link>
        </Button>
      </div>
    )
  }

  const stats = [
    { label: 'Iz prve', value: totals.firstTry },
    { label: 'Iz druge', value: totals.secondTry },
    { label: 'Promašeno', value: totals.missed },
  ]

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Trophy className="size-8" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">Sesija završena</p>
        <p className="font-heading text-4xl font-bold">{totals.points} poena</p>
      </div>
      <dl className="grid w-full grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-secondary p-3">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="font-heading text-2xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {totals.missed > 0 ? (
        <p className="text-sm text-muted-foreground">
          Promašene kartice se vraćaju danas, sa greškom na drugom mjestu.
        </p>
      ) : null}
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="h-12 text-base" onClick={onRestart}>
          Još jedna runda
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">Nazad na početnu</Link>
        </Button>
      </div>
    </div>
  )
}
