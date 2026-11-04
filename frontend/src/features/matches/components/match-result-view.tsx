import { CircleCheck, CircleX, Minus, Trophy } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyUserId } from '@/lib/realtime'
import { cn } from '@/lib/utils'

import { useMatchResult } from '../api/use-matches'
import type { MatchAnswer } from '../types'
import { ChallengeDialog } from './challenge-dialog'

type MatchResultViewProps = {
  matchId: number
}

export function MatchResultView({ matchId }: MatchResultViewProps) {
  const result = useMatchResult(matchId)
  const myUserId = useMyUserId()

  if (result.isPending) return <Skeleton className="h-80 bg-secondary" />
  if (result.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{result.error.message}</p>
        <Link to="/friends" className="text-sm text-primary underline-offset-4 hover:underline">
          Nazad na prijatelje
        </Link>
      </div>
    )
  }

  const { match, cards } = result.data
  const meId = myUserId ?? match.player1.id
  const iAmPlayer1 = meId === match.player1.id
  const opponent = iAmPlayer1 ? match.player2 : match.player1
  const myScore = iAmPlayer1 ? match.player1Score : match.player2Score
  const opponentScore = iAmPlayer1 ? match.player2Score : match.player1Score
  const won = match.winnerId === meId
  const draw = match.winnerId === null
  const missed = cards.filter(({ answers }) => !answers.some((a) => a.correct)).length

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className={cn(
            'flex size-16 items-center justify-center rounded-full',
            won ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
          )}
        >
          <Trophy className="size-8" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold">
          {draw ? 'Neriješeno!' : won ? 'Pobijedio si!' : `${opponent.displayName} je pobijedio`}
        </h1>
        <p className="font-heading text-4xl font-bold tabular-nums">
          {myScore} : {opponentScore}
        </p>
        <p className="text-sm text-muted-foreground">Tema: {match.topic}</p>
      </div>

      {missed > 0 ? (
        <p className="rounded-xl bg-secondary p-3 text-sm">
          Niko nije našao grešku na {missed} {missed === 1 ? 'kartici' : 'kartica'}. Pogledaj objašnjenja i
          izazovi ponovo.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Kartice</h2>
        <ul className="flex flex-col gap-2">
          {cards.map(({ card, answers }, i) => {
            const mine = answers.find((a) => a.userId === meId)
            const theirs = answers.find((a) => a.userId === opponent.id)
            return (
              <li key={card.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {card.wrongIndex === null ? 'Bez greške' : (card.correctText ?? '').trim()}
                </span>
                <AnswerIcon answer={mine} label="Ti" />
                <AnswerIcon answer={theirs} label={opponent.displayName} />
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <ChallengeDialog
          opponent={opponent}
          online
          initialTopic={match.topic}
          triggerLabel="Revanš"
          triggerClassName="h-12 w-full text-base"
        />
        <Button asChild variant="ghost">
          <Link to="/friends">Nazad na prijatelje</Link>
        </Button>
      </div>
    </section>
  )
}

function AnswerIcon({ answer, label }: { answer: MatchAnswer | undefined; label: string }) {
  if (answer?.correct) {
    return <CircleCheck className="size-5 text-success" aria-label={`${label}: tačno`} />
  }
  if (answer?.action === 'tap') {
    return <CircleX className="size-5 text-destructive" aria-label={`${label}: pogrešno`} />
  }
  return <Minus className="size-5 text-muted-foreground" aria-label={`${label}: bez odgovora`} />
}
