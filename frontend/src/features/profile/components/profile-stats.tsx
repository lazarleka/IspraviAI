import { Brain, CirclePercent, Crosshair, Gamepad2, Star, Trophy } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { useProfileStats } from '../api/use-profile'

const statDefinitions = [
  { key: 'matchesPlayed', label: 'Mečevi', icon: Gamepad2, suffix: '' },
  { key: 'wins', label: 'Pobjede', icon: Trophy, suffix: '' },
  { key: 'winRate', label: 'Uspješnost', icon: CirclePercent, suffix: '%' },
  { key: 'bestScore', label: 'Najbolji rezultat', icon: Star, suffix: '' },
  { key: 'cardsReviewed', label: 'Odgovorene kartice', icon: Brain, suffix: '' },
  { key: 'accuracy', label: 'Tačnost', icon: Crosshair, suffix: '%' },
] as const

export function ProfileStats() {
  const stats = useProfileStats()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Tvoji rezultati</h2>
      {stats.isPending ? (
        <div className="grid grid-cols-2 gap-3">
          {statDefinitions.map((stat) => (
            <Skeleton key={stat.key} className="h-24 bg-secondary" />
          ))}
        </div>
      ) : stats.isError ? (
        <Card className="border-profile-card-border bg-profile-card px-4 py-5 text-sm text-profile-card-foreground">
          Rezultati trenutno nijesu dostupni.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statDefinitions.map(({ key, label, icon: Icon, suffix }) => (
            <Card
              key={key}
              className="gap-2 border-profile-card-border bg-profile-card px-4 py-4 text-profile-card-foreground"
            >
              <Icon className="size-5 text-profile-card-accent" aria-hidden="true" />
              <p className="text-xs text-profile-card-muted">{label}</p>
              <p className="text-xl font-bold">
                {stats.data[key]}
                {suffix}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
