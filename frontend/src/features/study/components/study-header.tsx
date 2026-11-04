import { SubjectBadge } from '@/components/card/subject-badge'
import { Progress } from '@/components/ui/progress'
import type { Subject } from '@/lib/subjects'

type StudyHeaderProps = {
  subject: Subject
  index: number
  total: number
  points: number
}

export function StudyHeader({ subject, index, total, points }: StudyHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SubjectBadge subject={subject} />
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.min(index + 1, total)}</span> / {total}
          <span className="ml-3 font-heading font-bold text-primary">{points} poena</span>
        </span>
      </div>
      <Progress
        value={total === 0 ? 0 : (index / total) * 100}
        aria-label="Napredak u sesiji"
        className="h-1.5"
      />
    </div>
  )
}
