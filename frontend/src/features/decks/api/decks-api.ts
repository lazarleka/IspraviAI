import { apiFetch, type Page } from '@/lib/api-client'

import type { Deck, NewFileDeck, NewTopicDeck } from '../types'

export const decksApi = {
  list: () => apiFetch<Page<Deck>>('/decks'),
  get: (id: number) => apiFetch<Deck>(`/decks/${id}`),
  create: (input: NewTopicDeck) => apiFetch<Deck>('/decks', { method: 'POST', json: input }),
  upload: (input: NewFileDeck) => {
    const body = new FormData()
    body.append('file', input.file)
    body.append('requestedCards', String(input.requestedCards))
    if (input.title) body.append('title', input.title)
    if (input.subject) body.append('subject', input.subject)
    return apiFetch<Deck>('/decks/upload', { method: 'POST', body })
  },
  remove: (id: number) => apiFetch<void>(`/decks/${id}`, { method: 'DELETE' }),
}
