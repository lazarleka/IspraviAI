import { useEffect, useReducer } from 'react'

import type { CardAnswer, CardQuestion } from '@/lib/cards'
import { send, useRealtimeMessages } from '@/lib/realtime'

import {
  asMatchMessage,
  type CardEndReason,
  type MatchMessage,
  type MatchStatus,
  type Scores,
} from '../types'

export type LivePhase = 'connecting' | 'countdown' | 'card' | 'card_end' | 'finished'

export type CardEnd = {
  winnerId: number | null
  reason: CardEndReason
  card: CardAnswer
}

type LiveState = {
  phase: LivePhase
  startsAt: number | null
  index: number
  total: number
  card: CardQuestion | null
  endsAt: number | null
  /** What I did on this card: the segment I tapped (null = "Nema greške"), or "Ne znam". */
  myAction: { kind: 'tap'; index: number | null } | { kind: 'dont_know' } | null
  myResult: { correct: boolean; points: number } | null
  lockedIndexes: number[]
  end: CardEnd | null
  scores: Scores
  winnerId: number | null
  status: MatchStatus | null
  opponentDisconnected: boolean
  errorCode: string | null
}

type Action =
  | { type: 'server'; message: MatchMessage }
  | { type: 'local_tap'; index: number | null }
  | { type: 'local_dont_know' }
  | { type: 'error'; code: string }

const initialState: LiveState = {
  phase: 'connecting',
  startsAt: null,
  index: 0,
  total: 0,
  card: null,
  endsAt: null,
  myAction: null,
  myResult: null,
  lockedIndexes: [],
  end: null,
  scores: {},
  winnerId: null,
  status: null,
  opponentDisconnected: false,
  errorCode: null,
}

// Everything here is driven by server messages; the client never decides who won a card.
function reducer(state: LiveState, action: Action): LiveState {
  if (action.type === 'local_tap') return { ...state, myAction: { kind: 'tap', index: action.index } }
  if (action.type === 'local_dont_know') return { ...state, myAction: { kind: 'dont_know' } }
  if (action.type === 'error') return { ...state, errorCode: action.code }

  const message = action.message
  switch (message.type) {
    case 'match_ready':
      return { ...state, phase: 'countdown', startsAt: Date.parse(message.startsAt) }
    case 'card_start':
      return {
        ...state,
        phase: 'card',
        index: message.index,
        total: message.total,
        card: message.card,
        endsAt: Date.parse(message.endsAt),
        myAction: null,
        myResult: null,
        lockedIndexes: [],
        end: null,
        opponentDisconnected: false,
      }
    case 'answer_result': {
      const tapped = state.myAction?.kind === 'tap' ? state.myAction.index : null
      const locked =
        !message.correct && tapped !== null ? [...state.lockedIndexes, tapped] : state.lockedIndexes
      return {
        ...state,
        myResult: { correct: message.correct, points: message.points },
        lockedIndexes: locked,
      }
    }
    case 'card_end':
      return {
        ...state,
        phase: 'card_end',
        end: { winnerId: message.winnerId, reason: message.reason, card: message.card },
        scores: message.scores,
      }
    case 'opponent_disconnected':
      return { ...state, opponentDisconnected: true }
    case 'match_end':
      return {
        ...state,
        phase: 'finished',
        winnerId: message.winnerId,
        status: message.status,
        scores: message.scores,
      }
  }
}

export function useLiveMatch(matchId: number) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useRealtimeMessages((message) => {
    if (message.type === 'auth_ok') {
      send({ type: 'match_join', matchId })
      return
    }
    if (message.type === 'error' && typeof message.code === 'string') {
      dispatch({ type: 'error', code: message.code })
      return
    }
    const matchMessage = asMatchMessage(message)
    if (matchMessage && matchMessage.matchId === matchId) dispatch({ type: 'server', message: matchMessage })
  })

  useEffect(() => {
    send({ type: 'match_join', matchId })
  }, [matchId])

  const canAnswer = state.phase === 'card' && state.myAction === null

  function tap(index: number | null) {
    if (!canAnswer || !state.card) return
    dispatch({ type: 'local_tap', index })
    send({ type: 'match_tap', matchId, cardId: state.card.id, selectedIndex: index })
  }

  function dontKnow() {
    if (!canAnswer || !state.card) return
    dispatch({ type: 'local_dont_know' })
    send({ type: 'match_dont_know', matchId, cardId: state.card.id })
  }

  return { ...state, canAnswer, tap, dontKnow }
}
