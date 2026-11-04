import { Link, Navigate, useNavigate } from 'react-router'

import { AuthPage } from '@/app/routes/auth-page'
import { RegisterForm } from '@/features/auth/components/register-form'
import { useAuthToken } from '@/lib/auth-token'

export function Register() {
  const token = useAuthToken()
  const navigate = useNavigate()

  if (token !== null) return <Navigate to="/" replace />

  return (
    <AuthPage
      title="Napravi nalog"
      subtitle="Ubaci skriptu, nađi grešku, izazovi prijatelja."
      footer={
        <>
          Već imaš nalog?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Prijavi se
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthPage>
  )
}
