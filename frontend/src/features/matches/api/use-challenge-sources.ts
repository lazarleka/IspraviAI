import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch, type Page } from '@/lib/api-client'

export type ChallengeDeck = {
  id: number
  title: string
  sourceType: 'topic' | 'file'
  status: 'generating' | 'ready' | 'failed'
  cardCount: number
}

export function useChallengeDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: () => apiFetch<Page<ChallengeDeck>>('/decks'),
  })
}

export function useUploadChallengeScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, requestedCards }: { file: File; requestedCards: number }) => {
      const body = new FormData()
      body.append('file', file)
      body.append('requestedCards', String(requestedCards))
      return apiFetch<ChallengeDeck>('/decks/upload', { method: 'POST', body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
  })
}
