import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api/use-auth'
import { ProfileEditForm } from '@/features/profile/components/profile-edit-form'

export function ProfileEditPage() {
  const me = useMe()

  if (me.isPending) return <Skeleton className="h-96 w-full bg-secondary" />
  if (me.isError || !me.data) {
    return <p role="alert">Profil trenutno nije dostupan. Pokušaj ponovo.</p>
  }
  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProfileEditForm profile={me.data} />
    </div>
  )
}
