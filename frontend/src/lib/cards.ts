// Card shapes from docs/entities.md ("Card"). Shared by study and matches.
// A CardQuestion never carries the answer; the answer fields arrive only after the card was answered.
export type CardKind = 'text' | 'code'

export type ErrorType = 'fact' | 'calculation' | 'logic' | 'fake_source' | 'exaggeration' | 'code_bug'

export type CardQuestion = {
  id: number
  deckId: number
  kind: CardKind
  language: string | null
  segments: string[]
}

export type CardAnswer = CardQuestion & {
  /** Index of the wrong segment, or null when the card has no error. */
  wrongIndex: number | null
  correctText: string | null
  explanation: string
  errorType: ErrorType | null
  sourceRef: string | null
}
