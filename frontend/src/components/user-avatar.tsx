import { type AvatarColor, initials } from '@/lib/users'
import { cn } from '@/lib/utils'

type UserAvatarProps = {
  name: string
  online?: boolean
  color?: AvatarColor
  className?: string
}

const colorClasses: Record<AvatarColor, string> = {
  blue: 'bg-accent text-accent-foreground',
  amber: 'bg-primary text-primary-foreground',
  green: 'bg-success text-success-foreground',
  purple: 'bg-subject-programming text-card-foreground',
  rose: 'bg-subject-history text-card-foreground',
}

// Initials in a circle, with an optional green "online" dot. Used by friends and matches.
export function UserAvatar({ name, online, color = 'blue', className }: UserAvatarProps) {
  return (
    <span className={cn('relative inline-flex size-10 shrink-0', className)}>
      <span
        className={cn(
          'flex size-full items-center justify-center rounded-full font-heading text-sm font-bold',
          colorClasses[color],
        )}
      >
        {initials(name)}
      </span>
      {online !== undefined ? (
        <span
          className={cn(
            'absolute right-0 bottom-0 size-3 rounded-full border-2 border-secondary',
            online ? 'bg-success' : 'bg-muted-foreground',
          )}
        >
          <span className="sr-only">{online ? 'online' : 'offline'}</span>
        </span>
      ) : null}
    </span>
  )
}
