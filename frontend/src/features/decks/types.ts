// Deck, see docs/entities.md ("Deck").
import type { Subject } from '@/lib/subjects'

export type DeckStatus = 'generating' | 'ready' | 'failed'

export type Deck = {
  id: number
  title: string
  subject: Subject
  sourceType: 'topic' | 'file'
  topic: string | null
  fileName: string | null
  kind: 'study' | 'match'
  status: DeckStatus
  requestedCards: number
  cardCount: number
  /** 0–100, % of cards the signed-in user knows (box ≥ 3). */
  progress: number
  dueCount: number
  ownerId: number
  createdAt: string
}

export const CARD_COUNT_OPTIONS = [10, 15, 20] as const

export type NewTopicDeck = {
  topic: string
  title?: string
  subject?: Subject
  requestedCards: number
}

export type NewFileDeck = {
  file: File
  title?: string
  subject?: Subject
  requestedCards: number
}
