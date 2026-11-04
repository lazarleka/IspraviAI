import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { studyApi } from './study-api'

export function useStudyToday() {
  return useQuery({ queryKey: ['study', 'today'], queryFn: studyApi.today })
}

// A fresh set of cards every time a session starts.
export function useStudyCards(deckId: number) {
  return useQuery({
    queryKey: ['study', 'next', deckId],
    queryFn: () => studyApi.next(deckId),
    enabled: Number.isFinite(deckId),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useAnswerCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studyApi.answer,
    onSuccess: (result) => {
      if (result.card) void queryClient.invalidateQueries({ queryKey: ['study', 'today'] })
    },
  })
}

export function useReportCard() {
  return useMutation({ mutationFn: studyApi.report })
}
