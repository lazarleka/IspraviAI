import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Sparkles, Volume2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/user-avatar'
import { ApiError } from '@/lib/api-client'
import type { AvatarColor } from '@/lib/users'
import { cn } from '@/lib/utils'

import { useUpdateProfile } from '../api/use-profile'
import type { Profile } from '../types'
import { profileTheme } from '../profile-theme'

const avatarColors: Array<{ value: AvatarColor; label: string }> = [
  { value: 'blue', label: 'Plava' },
  { value: 'amber', label: 'Žuta' },
  { value: 'green', label: 'Zelena' },
  { value: 'purple', label: 'Ljubičasta' },
  { value: 'rose', label: 'Roze' },
]

const goals = [5, 10, 15, 20, 30, 50]

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [username, setUsername] = useState(profile.username)
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor)
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal)
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled)
  const [animationsEnabled, setAnimationsEnabled] = useState(profile.animationsEnabled)
  const [localError, setLocalError] = useState<string | null>(null)
  const updateProfile = useUpdateProfile()
  const navigate = useNavigate()
  const apiError = updateProfile.error instanceof ApiError ? updateProfile.error : null

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = displayName.trim()
    const normalizedUsername = username.trim().toLowerCase()
    if (!trimmedName) {
      setLocalError('Ime ne može biti prazno.')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setLocalError('Username mora imati 3–20 malih slova, brojeva ili donjih crta.')
      return
    }
    setLocalError(null)
    updateProfile.mutate(
      {
        displayName: trimmedName,
        username: normalizedUsername,
        avatarColor,
        dailyGoal,
        soundEnabled,
        animationsEnabled,
      },
      { onSuccess: () => navigate('/profile') },
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile" aria-label="Nazad na profil">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Uredi profil</h1>
          <p className="text-sm text-muted-foreground">Prilagodi kako ti aplikacija izgleda i radi.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6" style={profileTheme(avatarColor)} noValidate>
        <div className="flex justify-center">
          <UserAvatar
            name={displayName || profile.displayName}
            color={avatarColor}
            className="size-24 text-2xl"
          />
        </div>

        <div className="flex flex-col gap-4">
          <FormField
            id="display-name"
            label="Ime za prikaz"
            value={displayName}
            onChange={setDisplayName}
            maxLength={60}
            error={apiError?.fieldErrors.displayName}
          />
          <FormField
            id="username"
            label="Korisničko ime"
            value={username}
            onChange={setUsername}
            maxLength={20}
            autoCapitalize="none"
            error={apiError?.fieldErrors.username}
            hint="Mala slova, brojevi i donja crta."
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold">Boja avatara</legend>
          <div className="avatar-color-grid grid gap-2">
            {avatarColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setAvatarColor(color.value)}
                aria-label={color.label}
                aria-pressed={avatarColor === color.value}
                className={cn(
                  'flex h-12 items-center justify-center rounded-lg border bg-secondary',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  avatarColor === color.value && 'border-primary ring-2 ring-primary',
                )}
              >
                <UserAvatar
                  name={displayName || profile.displayName}
                  color={color.value}
                  className="size-8"
                />
                {avatarColor === color.value ? <Check className="sr-only" /> : null}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold">Dnevni cilj</legend>
          <div className="grid grid-cols-3 gap-2">
            {goals.map((goal) => (
              <Button
                key={goal}
                type="button"
                variant={dailyGoal === goal ? 'default' : 'secondary'}
                onClick={() => setDailyGoal(goal)}
              >
                {goal} kartica
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <SettingToggle
            icon={Volume2}
            label="Zvuk"
            description="Zvučni signal za tačan i pogrešan odgovor."
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
          <SettingToggle
            icon={Sparkles}
            label="Animacije"
            description="Pokreti kartica i proslave rezultata."
            checked={animationsEnabled}
            onChange={setAnimationsEnabled}
          />
        </div>

        {(localError ?? apiError?.message) ? (
          <p role="alert" className="text-sm text-destructive">
            {localError ?? apiError?.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-12" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Čuvam…' : 'Sačuvaj izmjene'}
        </Button>
      </form>
    </section>
  )
}

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  ...props
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  maxLength: number
  autoCapitalize?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...props}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className="h-11 bg-secondary"
      />
      {(error ?? hint) ? (
        <p className={cn('text-xs text-muted-foreground', error && 'text-destructive')}>{error ?? hint}</p>
      ) : null}
    </div>
  )
}

function SettingToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof Volume2
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-profile-card-border bg-profile-card p-4 text-profile-card-foreground transition-colors">
      <Icon className="size-5 shrink-0 text-profile-card-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-profile-card-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          checked ? 'bg-primary' : 'bg-muted-foreground',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 size-5 rounded-full bg-card transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
