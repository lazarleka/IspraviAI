import { useMutation, useQuery } from '@tanstack/react-query'

import { matchesApi } from './matches-api'

export function useCreateChallenge() {
  return useMutation({ mutationFn: matchesApi.createChallenge })
}

export function useCancelChallenge() {
  return useMutation({ mutationFn: matchesApi.cancelChallenge })
}

export function useAcceptChallenge() {
  return useMutation({ mutationFn: matchesApi.acceptChallenge })
}

export function useDeclineChallenge() {
  return useMutation({ mutationFn: matchesApi.declineChallenge })
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchesApi.getMatch(id),
    enabled: Number.isFinite(id),
  })
}

export function useMatchResult(id: number) {
  return useQuery({
    queryKey: ['matches', id, 'result'],
    queryFn: () => matchesApi.getResult(id),
    enabled: Number.isFinite(id),
    retry: false,
  })
}
