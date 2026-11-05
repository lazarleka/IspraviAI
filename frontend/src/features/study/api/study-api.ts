import { apiFetch } from '@/lib/api-client'

import type { AnswerInput, AnswerResult, NextCards, StudyToday } from '../types'

export const studyApi = {
  today: () => apiFetch<StudyToday>('/study/today'),
  next: (deckId: number, size = 10) =>
    apiFetch<NextCards>(`/study/decks/${deckId}/next?size=${size}`),
  answer: ({ cardId, ...input }: AnswerInput) =>
    apiFetch<AnswerResult>(`/study/cards/${cardId}/answer`, { method: 'POST', json: input }),
  report: (cardId: number) =>
    apiFetch<void>(`/study/cards/${cardId}/report`, { method: 'POST', json: {} }),
}
