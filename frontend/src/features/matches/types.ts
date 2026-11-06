// Challenge, Match and the live match messages, see docs/entities.md ("Challenge", "Match", "Realtime").
import type { CardAnswer, CardQuestion } from '@/lib/cards'
import type { RealtimeMessage } from '@/lib/realtime'
import type { PublicUser } from '@/lib/users'

export const MATCH_CARD_COUNTS = [5, 10, 15] as const

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'

export type Challenge = {
  id: number
  challenger: PublicUser
  opponent: PublicUser
  topic: string
  cardCount: number
  status: ChallengeStatus
  deckStatus: 'generating' | 'ready' | 'failed'
  matchId: number | null
  expiresAt: string
  createdAt: string
}

export type NewChallenge =
  | { opponentId: number; topic: string; deckId?: never; cardCount: number }
  | { opponentId: number; deckId: number; topic?: never; cardCount: number }

export type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned'

export type Match = {
  id: number
  challengeId: number
  deckId: number
  topic: string
  player1: PublicUser
  player2: PublicUser
  player1Score: number
  player2Score: number
  status: MatchStatus
  winnerId: number | null
  startedAt: string | null
  finishedAt: string | null
}

export type MatchAnswer = {
  cardId: number
  userId: number
  action: 'tap' | 'dont_know' | 'timeout'
  selectedIndex: number | null
  correct: boolean
  responseMs: number | null
  points: number
}

export type MatchResult = {
  match: Match
  cards: { card: CardAnswer; answers: MatchAnswer[] }[]
}

export type Scores = Record<string, number>

export type CardEndReason = 'correct' | 'both_done' | 'timeout'

// Server → client messages for challenges and the live match.
export type ChallengeMessage =
  { type: 'challenge_received'; challenge: Challenge } | { type: 'challenge_updated'; challenge: Challenge }

export type MatchMessage =
  | { type: 'match_ready'; matchId: number; startsAt: string }
  | { type: 'card_start'; matchId: number; index: number; total: number; card: CardQuestion; endsAt: string }
  | { type: 'answer_result'; matchId: number; cardId: number; correct: boolean; points: number }
  | {
      type: 'card_end'
      matchId: number
      cardId: number
      winnerId: number | null
      reason: CardEndReason
      card: CardAnswer
      scores: Scores
    }
  | { type: 'opponent_disconnected'; matchId: number; graceSeconds: number }
  | { type: 'match_end'; matchId: number; winnerId: number | null; status: MatchStatus; scores: Scores }

const CHALLENGE_TYPES = new Set(['challenge_received', 'challenge_updated'])
const MATCH_TYPES = new Set([
  'match_ready',
  'card_start',
  'answer_result',
  'card_end',
  'opponent_disconnected',
  'match_end',
])

// The server is trusted to follow docs/entities.md; the type field picks the shape.
export function asChallengeMessage(message: RealtimeMessage): ChallengeMessage | null {
  return CHALLENGE_TYPES.has(message.type) ? (message as unknown as ChallengeMessage) : null
}

export function asMatchMessage(message: RealtimeMessage): MatchMessage | null {
  return MATCH_TYPES.has(message.type) ? (message as unknown as MatchMessage) : null
}
