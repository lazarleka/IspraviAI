import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'

import { useRegister } from '../api/use-auth'
import { FormField } from './form-field'

// Limits match docs/entities.md ("User").
const schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Unesi ime.' })
    .max(60, { error: 'Ime može imati najviše 60 znakova.' }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, { error: '3–20 znakova: mala slova, brojevi i _' }),
  email: z.email({ error: 'Unesi ispravan email.' }),
  password: z
    .string()
    .min(8, { error: 'Lozinka mora imati bar 8 znakova.' })
    .max(72, { error: 'Lozinka može imati najviše 72 znaka.' }),
})

type RegisterValues = z.infer<typeof schema>
type FieldName = keyof RegisterValues

const FIELD_NAMES: FieldName[] = ['displayName', 'username', 'email', 'password']

const MESSAGES_BY_CODE: Record<string, { field: FieldName; message: string }> = {
  email_already_registered: { field: 'email', message: 'Ovaj email je već registrovan.' },
  username_taken: { field: 'username', message: 'Ovo korisničko ime je zauzeto.' },
}

type RegisterFormProps = {
  onSuccess: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) })

  // Show backend errors next to the field they belong to (fieldErrors from the API).
  const error = registerUser.error
  useEffect(() => {
    if (!(error instanceof ApiError)) return
    const known = MESSAGES_BY_CODE[error.code]
    if (known) {
      setError(known.field, { message: known.message })
      return
    }
    for (const name of FIELD_NAMES) {
      const message = error.fieldErrors[name]
      if (message) setError(name, { message })
    }
  }, [error, setError])

  const hasFieldError =
    error instanceof ApiError && (error.code in MESSAGES_BY_CODE || Object.keys(error.fieldErrors).length > 0)

  const onSubmit = handleSubmit((values) => registerUser.mutate(values, { onSuccess }))

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        id="displayName"
        label="Ime"
        autoComplete="name"
        placeholder="Ana Petrović"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
      <FormField
        id="username"
        label="Korisničko ime"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="ana_p"
        hint="Po njemu te prijatelji pronalaze."
        error={errors.username?.message}
        {...register('username')}
      />
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="ana@primjer.me"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        id="password"
        label="Lozinka"
        type="password"
        autoComplete="new-password"
        hint="Najmanje 8 znakova."
        error={errors.password?.message}
        {...register('password')}
      />
      {error && !hasFieldError ? (
        <p role="alert" className="rounded-md bg-wrong-surface p-3 text-sm text-wrong-surface-foreground">
          {error.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-12 text-base" disabled={registerUser.isPending}>
        {registerUser.isPending ? 'Pravim nalog…' : 'Napravi nalog'}
      </Button>
    </form>
  )
}
