import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { AuthPage } from '@/app/routes/auth-page'
import { LoginForm } from '@/features/auth/components/login-form'
import { useAuthToken } from '@/lib/auth-token'

function redirectTarget(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/'
}

export function Login() {
  const token = useAuthToken()
  const navigate = useNavigate()
  const location = useLocation()
  const target = redirectTarget(location.state)

  if (token !== null) return <Navigate to={target} replace />

  return (
    <AuthPage
      title="Prijavi se"
      subtitle="AI namjerno griješi. Ti nalaziš grešku."
      footer={
        <>
          Nemaš nalog?{' '}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Registruj se
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(target, { replace: true })} />
    </AuthPage>
  )
}
