import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'

import { useLogin } from '../api/use-auth'
import { FormField } from './form-field'

const schema = z.object({
  identifier: z.string().trim().min(3, { error: 'Unesi email ili korisničko ime.' }),
  password: z.string().min(1, { error: 'Unesi lozinku.' }),
})

type LoginValues = z.infer<typeof schema>

type LoginFormProps = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => login.mutate(values, { onSuccess }))

  const formError =
    login.error instanceof ApiError && login.error.code === 'invalid_credentials'
      ? 'Pogrešan email, korisničko ime ili lozinka.'
      : login.error?.message

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        id="identifier"
        label="Email ili korisničko ime"
        type="text"
        autoComplete="username"
        placeholder="ana@primjer.me ili ana"
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <FormField
        id="password"
        label="Lozinka"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {formError ? (
        <p role="alert" className="rounded-md bg-wrong-surface p-3 text-sm text-wrong-surface-foreground">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-12 text-base" disabled={login.isPending}>
        {login.isPending ? 'Prijavljujem…' : 'Prijavi se'}
      </Button>
    </form>
  )
}
