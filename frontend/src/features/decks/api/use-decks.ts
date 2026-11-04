import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { decksApi } from './decks-api'

const POLL_MS = 2000

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: decksApi.list,
    // Keep the list fresh while any deck is still being generated.
    refetchInterval: (query) =>
      query.state.data?.items.some((d) => d.status === 'generating') ? POLL_MS : false,
  })
}

export function useDeck(id: number) {
  return useQuery({
    queryKey: ['decks', id],
    queryFn: () => decksApi.get(id),
    enabled: Number.isFinite(id),
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? POLL_MS : false),
  })
}

export function useCreateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decksApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
  })
}

export function useUploadDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decksApi.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
  })
}

export function useDeleteDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decksApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
  })
}
