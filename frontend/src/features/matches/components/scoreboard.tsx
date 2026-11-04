import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'

type Player = {
  name: string
  score: number
}

type ScoreboardProps = {
  me: Player
  opponent: Player
  index: number
  total: number
}

export function Scoreboard({ me, opponent, index, total }: ScoreboardProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-secondary p-3">
      <PlayerScore player={me} align="left" />
      <span className="text-center text-xs text-muted-foreground">
        {total > 0 ? `${Math.min(index + 1, total)} / ${total}` : 'vs'}
      </span>
      <PlayerScore player={opponent} align="right" />
    </div>
  )
}

function PlayerScore({ player, align }: { player: Player; align: 'left' | 'right' }) {
  return (
    <div
      className={cn('flex min-w-0 items-center gap-2', align === 'right' && 'flex-row-reverse text-right')}
    >
      <UserAvatar name={player.name} className="size-9" />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{player.name}</p>
        <p className="font-heading text-xl font-bold tabular-nums">{player.score}</p>
      </div>
    </div>
  )
}
