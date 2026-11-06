import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useMe } from '@/features/auth/api/use-auth'
import { MatchHistory } from '@/features/matches/components/match-history'
import { ProfileOverview } from '@/features/profile/components/profile-overview'
import { ProfileStats } from '@/features/profile/components/profile-stats'
import { profileTheme } from '@/features/profile/profile-theme'

export function ProfilePage() {
  const me = useMe()
  const logout = useLogout()

  if (me.isPending) return <Skeleton className="h-96 w-full bg-secondary" />
  if (me.isError || !me.data) {
    return <p role="alert">Profil trenutno nije dostupan. Pokušaj ponovo.</p>
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8" style={profileTheme(me.data.avatarColor)}>
      <ProfileOverview profile={me.data} />
      <ProfileStats />
      <MatchHistory userId={me.data.id} />
      <Button variant="outline" size="lg" className="h-12" onClick={logout}>
        <LogOut className="size-4" aria-hidden="true" />
        Odjavi se
      </Button>
    </div>
  )
}
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
