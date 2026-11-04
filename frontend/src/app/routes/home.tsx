import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api/use-auth'
import { DeckList } from '@/features/decks/components/deck-list'
import { StudyTodayCard } from '@/features/study/components/study-today-card'

export function Home() {
  const me = useMe()

  return (
    <section className="flex flex-col gap-6">
      {me.isPending ? (
        <Skeleton className="h-7 w-40 bg-secondary" />
      ) : me.isError ? (
        <h1 className="text-2xl font-bold">Zdravo</h1>
      ) : (
        <h1 className="text-2xl font-bold">Zdravo, {me.data.displayName.split(' ')[0]}</h1>
      )}

      <StudyTodayCard />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Tvoji špilovi</h2>
        <DeckList />
      </div>
    </section>
  )
}
