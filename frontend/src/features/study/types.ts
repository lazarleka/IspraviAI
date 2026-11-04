// Study, see docs/entities.md ("Study").
import type { CardAnswer, CardQuestion } from '@/lib/cards'

export type StudyToday = {
  dueCount: number
  decks: { deckId: number; title: string; subject: string; dueCount: number }[]
}

export type NextCards = {
  items: CardQuestion[]
}

export type AnswerInput = {
  cardId: number
  /** null = "Nema greške" */
  selectedIndex: number | null
  attempt: 1 | 2
}

export type AnswerResult = {
  correct: boolean
  points: number
  /** Set when the answer is correct or this was the second attempt. */
  card: CardAnswer | null
}
