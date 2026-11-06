import { FriendList } from '@/features/friends/components/friend-list'
import { RequestList } from '@/features/friends/components/request-list'
import { UserSearch } from '@/features/friends/components/user-search'
import { ChallengeDialog } from '@/features/matches/components/challenge-dialog'

// Combines friends (search, requests, list) and matches (the challenge button on every friend).
export function Friends() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Prijatelji</h1>
        <p className="text-sm text-muted-foreground">Izazovi prijatelja koji je online na PvP meč.</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Pronađi prijatelja</h2>
            <UserSearch />
          </div>
          <RequestList />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Tvoji prijatelji</h2>
          <FriendList
            renderAction={(friend, online) => <ChallengeDialog opponent={friend} online={online} />}
          />
        </div>
      </div>
    </section>
  )
}
