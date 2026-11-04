import { RequireAuth } from '@/app/require-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { SignOutButton } from '@/features/auth/components/sign-out-button'
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
  return <AppLayout headerAction={<SignOutButton />} overlay={<ChallengeToast />} />
}
