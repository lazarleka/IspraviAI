import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { friendsApi } from './friends-api'

export function useFriends() {
  return useQuery({ queryKey: ['friends'], queryFn: friendsApi.list })
}

export function useFriendRequests() {
  return useQuery({ queryKey: ['friends', 'requests'], queryFn: friendsApi.requests })
}

export function useUserSearch(search: string) {
  const q = search.trim().toLowerCase()
  return useQuery({
    queryKey: ['users', q],
    queryFn: () => friendsApi.searchUsers(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
}

function useInvalidateFriends() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['friends'] })
}

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriends()
  return useMutation({ mutationFn: friendsApi.sendRequest, onSuccess: invalidate })
}

export function useAcceptFriendRequest() {
  const invalidate = useInvalidateFriends()
  return useMutation({ mutationFn: friendsApi.accept, onSuccess: invalidate })
}

export function useRemoveFriendship() {
  const invalidate = useInvalidateFriends()
  return useMutation({ mutationFn: friendsApi.remove, onSuccess: invalidate })
}
