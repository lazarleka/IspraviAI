import { AtSign, CalendarDays, Mail, Pencil, Sparkles, Target, Volume2 } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'

import type { Profile } from '../types'

function joinedAt(value: string) {
  return new Intl.DateTimeFormat('sr-Latn-ME', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function ProfileOverview({ profile }: { profile: Profile }) {
  const firstName = profile.displayName.split(' ')[0] ?? profile.displayName

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.5fr)] lg:gap-8">
      <div className="flex flex-col gap-5 rounded-xl lg:border lg:bg-secondary lg:p-6">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start">
          <UserAvatar
            name={profile.displayName}
            color={profile.avatarColor}
            className="size-20 text-xl lg:size-24 lg:text-2xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Zdravo,</p>
            <h1 className="truncate text-2xl font-bold lg:text-3xl">{firstName} 👋</h1>
            <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <Button asChild size="lg" className="h-12 lg:w-full">
          <Link to="/profile/edit">
            <Pencil className="size-4" aria-hidden="true" />
            Uredi profil
          </Link>
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Card className="gap-0 border-profile-card-border bg-profile-card py-2 text-profile-card-foreground">
          <CardContent className="divide-y px-4">
            <ProfileRow icon={Mail} label="Email" value={profile.email} />
            <ProfileRow icon={AtSign} label="Korisničko ime" value={`@${profile.username}`} />
            <ProfileRow icon={CalendarDays} label="Član od" value={joinedAt(profile.createdAt)} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Tvoje postavke</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Preference icon={Target} label="Dnevni cilj" value={`${profile.dailyGoal} kartica`} />
            <Preference icon={Volume2} label="Zvuk" value={profile.soundEnabled ? 'Uključen' : 'Isključen'} />
            <Preference
              icon={Sparkles}
              label="Animacije"
              value={profile.animationsEnabled ? 'Uključene' : 'Isključene'}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

type Icon = typeof Mail

function ProfileRow({ icon: Icon, label, value }: { icon: Icon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="size-5 shrink-0 text-profile-card-accent" aria-hidden="true" />
      <span className="text-sm text-profile-card-muted">{label}</span>
      <span className="ml-auto max-w-52 truncate text-sm font-semibold">{value}</span>
    </div>
  )
}

function Preference({ icon: Icon, label, value }: { icon: Icon; label: string; value: string }) {
  return (
    <Card className="gap-2 border-profile-card-border bg-profile-card px-4 py-4 text-profile-card-foreground">
      <Icon className="size-5 text-profile-card-accent" aria-hidden="true" />
      <p className="text-xs text-profile-card-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </Card>
  )
}
