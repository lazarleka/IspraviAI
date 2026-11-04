import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAuthToken } from '@/lib/auth-token'

type RequireAuthProps = {
  children: ReactNode
}

// Signed-out users go to /login and come back to the page they wanted after signing in.
// An expired token is cleared by apiFetch on the first 401, which sends the user here as well.
export function RequireAuth({ children }: RequireAuthProps) {
  const token = useAuthToken()
  const location = useLocation()

  if (token === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
