import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api/use-auth'
import { DeckList } from '@/features/decks/components/deck-list'
import { StudyTodayCard } from '@/features/study/components/study-today-card'

export function Home() {
  const me = useMe()

  return (
    <section className="flex flex-col gap-7 lg:gap-9">
      <div>
        <p className="mb-1 text-sm text-muted-foreground lg:text-base">Dobro došao nazad</p>
        {me.isPending ? (
          <Skeleton className="h-9 w-52 bg-secondary" />
        ) : me.isError ? (
          <h1 className="text-3xl font-bold lg:text-4xl">Zdravo</h1>
        ) : (
          <h1 className="text-3xl font-bold lg:text-4xl">Zdravo, {me.data.displayName.split(' ')[0]}</h1>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-base font-semibold lg:text-lg">Današnji pregled</h2>
        <StudyTodayCard />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold lg:text-lg">Tvoji špilovi</h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">Uči svojim tempom</span>
        </div>
        <DeckList />
      </div>
    </section>
  )
}
