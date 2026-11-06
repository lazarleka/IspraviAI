import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { profileApi } from './profile-api'

export function useProfileStats() {
  return useQuery({ queryKey: ['profile', 'stats'], queryFn: profileApi.stats })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  })
}
