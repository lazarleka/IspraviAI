import { FriendList } from '@/features/friends/components/friend-list'
import { RequestList } from '@/features/friends/components/request-list'
import { UserSearch } from '@/features/friends/components/user-search'
import { ChallengeDialog } from '@/features/matches/components/challenge-dialog'

// Combines friends (search, requests, list) and matches (the challenge button on every friend).
export function Friends() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Prijatelji</h1>
        <p className="text-sm text-muted-foreground">Izazovi prijatelja koji je online na PvP meč.</p>
      </div>
      <UserSearch />
      <RequestList />
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Tvoji prijatelji</h2>
        <FriendList
          renderAction={(friend, online) => <ChallengeDialog opponent={friend} online={online} />}
        />
      </div>
    </section>
  )
}
