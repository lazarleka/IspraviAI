import { initials } from '@/lib/users'
import { cn } from '@/lib/utils'

type UserAvatarProps = {
  name: string
  online?: boolean
  className?: string
}

// Initials in a circle, with an optional green "online" dot. Used by friends and matches.
export function UserAvatar({ name, online, className }: UserAvatarProps) {
  return (
    <span className={cn('relative inline-flex size-10 shrink-0', className)}>
      <span className="flex size-full items-center justify-center rounded-full bg-background font-heading text-sm font-bold text-accent">
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
