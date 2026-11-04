// Deck subjects, see docs/entities.md ("Deck"). Shared by decks, study and matches.
export const SUBJECTS = [
  'biology',
  'history',
  'programming',
  'math',
  'physics',
  'chemistry',
  'language',
  'other',
] as const

export type Subject = (typeof SUBJECTS)[number]

export const SUBJECT_LABELS: Record<Subject, string> = {
  biology: 'Biologija',
  history: 'Istorija',
  programming: 'Programiranje',
  math: 'Matematika',
  physics: 'Fizika',
  chemistry: 'Hemija',
  language: 'Jezik',
  other: 'Ostalo',
}
