import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { clearToken, setToken, useAuthToken } from '@/lib/auth-token'

import type { AuthResponse } from '../types'
import { authApi } from './auth-api'

const ME_KEY = ['me'] as const

export function useMe() {
  const token = useAuthToken()
  return useQuery({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

function useSignIn() {
  const queryClient = useQueryClient()
  return (response: AuthResponse) => {
    setToken(response.token)
    queryClient.setQueryData(ME_KEY, response.user)
  }
}

export function useLogin() {
  const signIn = useSignIn()
  return useMutation({ mutationFn: authApi.login, onSuccess: signIn })
}

export function useRegister() {
  const signIn = useSignIn()
  return useMutation({ mutationFn: authApi.register, onSuccess: signIn })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    clearToken()
    queryClient.clear()
  }
}
