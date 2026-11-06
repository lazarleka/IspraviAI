import { NavLink } from 'react-router'

import { RequireAuth } from '@/app/require-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useMe } from '@/features/auth/api/use-auth'
import { ChallengeToast } from '@/features/matches/components/challenge-toast'
import { useRealtimeConnection } from '@/lib/realtime'

// The shell for every signed-in screen: one realtime connection, and incoming challenges on any page.
export function AuthedLayout() {
  return (
    <RequireAuth>
      <RealtimeShell />
    </RequireAuth>
  )
}

function RealtimeShell() {
  useRealtimeConnection()
  const me = useMe()
  const profileShortcut = me.data ? (
    <NavLink
      to="/profile"
      className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label="Otvori profil"
    >
      <UserAvatar name={me.data.displayName} color={me.data.avatarColor} />
    </NavLink>
  ) : (
    <Skeleton className="size-10 rounded-full bg-secondary" />
  )
  return <AppLayout headerAction={profileShortcut} overlay={<ChallengeToast />} />
}
