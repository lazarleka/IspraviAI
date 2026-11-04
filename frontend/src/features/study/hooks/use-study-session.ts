import { useState } from 'react'

import type { CardAnswer, CardQuestion } from '@/lib/cards'

import { useAnswerCard } from '../api/use-study'

// choose → (wrong on attempt 1) retry → revealed → next card … → done
export type StudyPhase = 'choose' | 'retry' | 'revealed' | 'done'

export type SessionTotals = {
  points: number
  firstTry: number
  secondTry: number
  missed: number
}

type SessionState = {
  index: number
  phase: StudyPhase
  selectedIndex: number | null
  lockedIndexes: number[]
  triedNoError: boolean
  revealed: CardAnswer | null
  lastPoints: number
  lastCorrect: boolean
  shakeKey: number
  totals: SessionTotals
}

const initialState: SessionState = {
  index: 0,
  phase: 'choose',
  selectedIndex: null,
  lockedIndexes: [],
  triedNoError: false,
  revealed: null,
  lastPoints: 0,
  lastCorrect: false,
  shakeKey: 0,
  totals: { points: 0, firstTry: 0, secondTry: 0, missed: 0 },
}

export function useStudySession(cards: CardQuestion[]) {
  const [state, setState] = useState<SessionState>(initialState)
  const answerCard = useAnswerCard()
  const card: CardQuestion | undefined = cards[state.index]
  const phase: StudyPhase = cards.length === 0 ? 'done' : state.phase

  function select(index: number) {
    if (state.phase !== 'choose' && state.phase !== 'retry') return
    setState((s) => ({ ...s, selectedIndex: s.selectedIndex === index ? null : index }))
  }

  // selectedIndex null = "Nema greške"
  function submit(selectedIndex: number | null) {
    if (!card || answerCard.isPending) return
    const attempt = state.phase === 'retry' ? 2 : 1

    answerCard.mutate(
      { cardId: card.id, selectedIndex, attempt },
      {
        onSuccess: (result) => {
          setState((s) => {
            if (result.card === null) {
              // Wrong on the first attempt: lock what was tried, keep the answer hidden.
              return {
                ...s,
                phase: 'retry',
                selectedIndex: null,
                lockedIndexes: selectedIndex === null ? s.lockedIndexes : [...s.lockedIndexes, selectedIndex],
                triedNoError: s.triedNoError || selectedIndex === null,
                shakeKey: s.shakeKey + 1,
              }
            }
            const totals = { ...s.totals, points: s.totals.points + result.points }
            if (result.correct && attempt === 1) totals.firstTry += 1
            else if (result.correct) totals.secondTry += 1
            else totals.missed += 1
            return {
              ...s,
              phase: 'revealed',
              revealed: result.card,
              lastPoints: result.points,
              lastCorrect: result.correct,
              shakeKey: result.correct ? s.shakeKey : s.shakeKey + 1,
              totals,
            }
          })
        },
      },
    )
  }

  function next() {
    setState((s) => {
      const index = s.index + 1
      if (index >= cards.length) return { ...s, phase: 'done' }
      return { ...initialState, index, totals: s.totals, shakeKey: s.shakeKey }
    })
  }

  return {
    card,
    index: state.index,
    total: cards.length,
    phase,
    selectedIndex: state.selectedIndex,
    lockedIndexes: state.lockedIndexes,
    triedNoError: state.triedNoError,
    revealed: state.revealed,
    lastPoints: state.lastPoints,
    lastCorrect: state.lastCorrect,
    shakeKey: state.shakeKey,
    totals: state.totals,
    isSubmitting: answerCard.isPending,
    submitError: answerCard.error,
    select,
    submit,
    next,
  }
}
