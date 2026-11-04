import { SUBJECT_LABELS, type Subject } from '@/lib/subjects'
import { cn } from '@/lib/utils'

import { SUBJECT_STYLES } from './subject-style'

type SubjectBadgeProps = {
  subject: Subject
  className?: string
}

export function SubjectBadge({ subject, className }: SubjectBadgeProps) {
  const style = SUBJECT_STYLES[subject]
  const Icon = style.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold',
        style.text,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {SUBJECT_LABELS[subject]}
    </span>
  )
}

type SubjectIconProps = {
  subject: Subject
  className?: string
}

export function SubjectIcon({ subject, className }: SubjectIconProps) {
  const style = SUBJECT_STYLES[subject]
  const Icon = style.icon
  return <Icon className={cn('size-5', style.text, className)} aria-hidden="true" />
}
