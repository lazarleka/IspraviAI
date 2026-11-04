// MOCK until the backend has /api/study. Matches docs/entities.md ("Study"): next() returns questions
// only; the answer fields come back from answer(), after the user answered.
import type { CardAnswer, CardQuestion } from '@/lib/cards'
import { NotFoundError, delay } from '@/lib/mock-db'

import type { AnswerInput, AnswerResult, NextCards, StudyToday } from '../types'
import { CARD_BANKS, FALLBACK_BANK } from './mock-cards'

type StoredCard = CardAnswer & { factKey: string }

type Progress = {
  box: 1 | 2 | 3 | 4
  dueAt: number
  lastSeenAt: number | null
  reported: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000
const INTERVAL_BY_BOX: Record<Progress['box'], number> = {
  1: 0,
  2: 3 * DAY_MS,
  3: 7 * DAY_MS,
  4: 14 * DAY_MS,
}

const cardsByDeck = new Map<number, StoredCard[]>()
const progress = new Map<number, Progress>()
let nextCardId = 1000

function cardsOf(deckId: number): StoredCard[] {
  const existing = cardsByDeck.get(deckId)
  if (existing) return existing
  const bank = CARD_BANKS[deckId] ?? FALLBACK_BANK
  const cards = bank.map((card) => ({ ...card, id: nextCardId++, deckId }))
  cardsByDeck.set(deckId, cards)
  return cards
}

function findCard(cardId: number): StoredCard | undefined {
  for (const cards of cardsByDeck.values()) {
    const card = cards.find((c) => c.id === cardId)
    if (card) return card
  }
  return undefined
}

function toQuestion({ id, deckId, kind, language, segments }: StoredCard): CardQuestion {
  return { id, deckId, kind, language, segments }
}

function toAnswer(card: StoredCard): CardAnswer {
  const { factKey: _factKey, ...answer } = card
  return answer
}

function isDue(cardId: number, now: number) {
  const p = progress.get(cardId)
  return !p || (!p.reported && p.dueAt <= now)
}

// One variant per fact: the one seen least recently, so the error is in a new place next time.
function pickVariants(deckId: number): StoredCard[] {
  const byFact = new Map<string, StoredCard[]>()
  for (const card of cardsOf(deckId)) {
    if (progress.get(card.id)?.reported) continue
    byFact.set(card.factKey, [...(byFact.get(card.factKey) ?? []), card])
  }
  return [...byFact.values()]
    .map(
      (variants) =>
        [...variants].sort(
          (a, b) => (progress.get(a.id)?.lastSeenAt ?? -1) - (progress.get(b.id)?.lastSeenAt ?? -1),
        )[0],
    )
    .filter((card): card is StoredCard => card !== undefined)
}

function countDue(deckId: number, now: number) {
  return pickVariants(deckId).filter((card) => isDue(card.id, now)).length
}

export const studyApi = {
  today: (): Promise<StudyToday> => {
    const now = Date.now()
    const decks = [
      { deckId: 1, title: 'Fotosinteza', subject: 'biology' },
      { deckId: 2, title: 'Prvi i Drugi srpski ustanak', subject: 'history' },
      { deckId: 3, title: 'Rekurzija u C-u', subject: 'programming' },
    ].map((deck) => ({ ...deck, dueCount: countDue(deck.deckId, now) }))
    return delay({ dueCount: decks.reduce((sum, d) => sum + d.dueCount, 0), decks })
  },

  next: (deckId: number, size = 10): Promise<NextCards> => {
    const now = Date.now()
    // Due cards first; for the demo, cards that are not due yet follow, so a session is never empty.
    const cards = pickVariants(deckId).sort((a, b) => Number(isDue(b.id, now)) - Number(isDue(a.id, now)))
    return delay({ items: cards.slice(0, size).map(toQuestion) })
  },

  answer: ({ cardId, selectedIndex, attempt }: AnswerInput): Promise<AnswerResult> => {
    const card = findCard(cardId)
    if (!card) return Promise.reject(new NotFoundError('Card', cardId))

    const correct = selectedIndex === card.wrongIndex
    const finished = correct || attempt === 2
    const now = Date.now()
    const current = progress.get(cardId) ?? { box: 1, dueAt: now, lastSeenAt: null, reported: false }

    if (finished) {
      const box: Progress['box'] = correct
        ? attempt === 1
          ? (Math.min(current.box + 1, 4) as Progress['box'])
          : current.box
        : 1
      progress.set(cardId, { ...current, box, dueAt: now + INTERVAL_BY_BOX[box], lastSeenAt: now })
    }

    const points = correct ? (attempt === 1 ? 10 : 5) : 0
    return delay({ correct, points, card: finished ? toAnswer(card) : null })
  },

  report: (cardId: number) => {
    const current = progress.get(cardId) ?? { box: 1, dueAt: Date.now(), lastSeenAt: null, reported: false }
    progress.set(cardId, { ...current, reported: true })
    return delay(undefined)
  },
}
