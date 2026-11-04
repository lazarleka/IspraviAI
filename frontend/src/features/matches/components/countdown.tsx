import { useEffect, useState } from 'react'

type CountdownProps = {
  startsAt: number | null
  topic: string
}

export function Countdown({ startsAt, topic }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [])

  const seconds = startsAt === null ? null : Math.max(1, Math.ceil((startsAt - now) / 1000))

  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm text-muted-foreground">Tema: {topic}</p>
      {seconds === null ? (
        <p className="font-heading text-xl font-bold">Povezujem…</p>
      ) : (
        <p
          key={seconds}
          className="font-heading text-8xl font-bold text-primary motion-safe:animate-in motion-safe:zoom-in-50"
        >
          {seconds}
        </p>
      )}
      <p className="text-sm text-muted-foreground">Ko prvi nađe grešku, nosi poene.</p>
    </div>
  )
}
