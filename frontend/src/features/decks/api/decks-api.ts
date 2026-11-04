// MOCK until the backend has /api/decks. The functions match docs/entities.md ("Deck"):
// when the backend is ready, replace each body with apiFetch(...) and read `items` from list().
import { ApiError, type Page } from '@/lib/api-client'
import { NotFoundError, delay } from '@/lib/mock-db'
import type { Subject } from '@/lib/subjects'

import type { Deck, NewFileDeck, NewTopicDeck } from '../types'

const GENERATION_MS = 3000
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md']

const base = { kind: 'study', status: 'ready', ownerId: 1 } as const

let decks: Deck[] = [
  {
    ...base,
    id: 1,
    title: 'Fotosinteza',
    subject: 'biology',
    sourceType: 'file',
    topic: null,
    fileName: 'biologija-skripta.pdf',
    requestedCards: 10,
    cardCount: 10,
    progress: 70,
    dueCount: 4,
    createdAt: '2026-11-02T18:20:00Z',
  },
  {
    ...base,
    id: 2,
    title: 'Prvi i Drugi srpski ustanak',
    subject: 'history',
    sourceType: 'topic',
    topic: 'Prvi i Drugi srpski ustanak',
    fileName: null,
    requestedCards: 10,
    cardCount: 6,
    progress: 40,
    dueCount: 3,
    createdAt: '2026-11-01T15:05:00Z',
  },
  {
    ...base,
    id: 3,
    title: 'Rekurzija u C-u',
    subject: 'programming',
    sourceType: 'topic',
    topic: 'Rekurzija i nizovi u C-u',
    fileName: null,
    requestedCards: 10,
    cardCount: 8,
    progress: 25,
    dueCount: 5,
    createdAt: '2026-10-30T20:40:00Z',
  },
]

// Mimics the backend's background generation: "generating" for a few seconds, then "ready".
function scheduleReady(id: number) {
  setTimeout(() => {
    decks = decks.map((d) => (d.id === id ? { ...d, status: 'ready', cardCount: d.requestedCards } : d))
  }, GENERATION_MS)
}

function guessSubject(text: string): Subject {
  const t = text.toLowerCase()
  if (/(\bc\b|java|python|kod|rekurz|niz|petlj|funkcij)/.test(t)) return 'programming'
  if (/(ustan|rat|vijek|istorij|kralj)/.test(t)) return 'history'
  if (/(ćelij|biljk|fotosint|biolog|organ)/.test(t)) return 'biology'
  if (/(njutn|sila|fizik|brzin|energij|struj)/.test(t)) return 'physics'
  if (/(hemij|atom|molekul|reakcij)/.test(t)) return 'chemistry'
  if (/(matemat|jednačin|integral|izvod|trougl|razlom)/.test(t)) return 'math'
  return 'other'
}

function newDeck(
  fields: Pick<Deck, 'title' | 'subject' | 'sourceType' | 'topic' | 'fileName' | 'requestedCards'>,
): Deck {
  const deck: Deck = {
    ...base,
    ...fields,
    id: Date.now(),
    status: 'generating',
    cardCount: 0,
    progress: 0,
    dueCount: 0,
    createdAt: new Date().toISOString(),
  }
  decks = [deck, ...decks]
  scheduleReady(deck.id)
  return deck
}

export const decksApi = {
  list: (): Promise<Page<Deck>> => delay({ total: decks.length, items: decks, pages: 1 }),

  get: (id: number) => {
    const deck = decks.find((d) => d.id === id)
    if (!deck) return Promise.reject(new NotFoundError('Deck', id))
    return delay(deck)
  },

  create: (input: NewTopicDeck) =>
    delay(
      newDeck({
        title: input.title?.trim() || input.topic.trim().slice(0, 80),
        subject: input.subject ?? guessSubject(input.topic),
        sourceType: 'topic',
        topic: input.topic.trim(),
        fileName: null,
        requestedCards: input.requestedCards,
      }),
    ),

  upload: (input: NewFileDeck) => {
    const extension = input.file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return Promise.reject(new ApiError(415, 'Podržani su PDF, TXT i MD fajlovi.', 'unsupported_file_type'))
    }
    if (input.file.size > MAX_UPLOAD_BYTES) {
      return Promise.reject(new ApiError(413, 'Fajl je veći od 10 MB.', 'file_too_large'))
    }
    const name = input.file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    return delay(
      newDeck({
        title: input.title?.trim() || name.slice(0, 80),
        subject: input.subject ?? guessSubject(name),
        sourceType: 'file',
        topic: null,
        fileName: input.file.name,
        requestedCards: input.requestedCards,
      }),
    )
  },

  remove: (id: number) => {
    decks = decks.filter((d) => d.id !== id)
    return delay(undefined)
  },
}
