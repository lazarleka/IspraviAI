import { BookOpen, Code, FlaskConical, Landmark, Leaf, Sigma, Atom, Languages } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Subject } from '@/lib/subjects'

type SubjectStyle = {
  icon: LucideIcon
  /** Text color on navy (icons, percentages). */
  text: string
  /** Solid fill (progress bars). */
  fill: string
  /** Top stripe of a white card. */
  stripe: string
}

const GREEN = { text: 'text-subject-biology', fill: 'bg-subject-biology', stripe: 'border-t-subject-biology' }
const CORAL = { text: 'text-subject-history', fill: 'bg-subject-history', stripe: 'border-t-subject-history' }
const VIOLET = {
  text: 'text-subject-programming',
  fill: 'bg-subject-programming',
  stripe: 'border-t-subject-programming',
}
const BLUE = { text: 'text-subject-other', fill: 'bg-subject-other', stripe: 'border-t-subject-other' }

export const SUBJECT_STYLES: Record<Subject, SubjectStyle> = {
  biology: { icon: Leaf, ...GREEN },
  history: { icon: Landmark, ...CORAL },
  programming: { icon: Code, ...VIOLET },
  math: { icon: Sigma, ...BLUE },
  physics: { icon: Atom, ...BLUE },
  chemistry: { icon: FlaskConical, ...BLUE },
  language: { icon: Languages, ...BLUE },
  other: { icon: BookOpen, ...BLUE },
}
