import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type TimerBarProps = {
  /** Server time when the card ends (ms). The bar never decides anything, it only shows time. */
  endsAt: number | null
  totalMs?: number
  paused?: boolean
}

export function TimerBar({ endsAt, totalMs = 20_000, paused = false }: TimerBarProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (paused || endsAt === null) return
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [endsAt, paused])

  const remaining = endsAt === null ? 0 : Math.max(0, endsAt - now)
  const percent = Math.min(100, (remaining / totalMs) * 100)
  const urgent = remaining < 5_000

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label="Preostalo vrijeme"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalMs / 1000)}
        aria-valuenow={Math.ceil(remaining / 1000)}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-100 ease-linear',
            urgent ? 'bg-destructive' : 'bg-primary',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={cn(
          'w-8 text-right font-heading text-sm font-bold tabular-nums',
          urgent && 'text-destructive',
        )}
      >
        {Math.ceil(remaining / 1000)}s
      </span>
    </div>
  )
}
