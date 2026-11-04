import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'

import { AnswerReveal } from '@/components/card/answer-reveal'
import { SegmentCard } from '@/components/card/segment-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyUserId } from '@/lib/realtime'
import { cn } from '@/lib/utils'

import { useMatch } from '../api/use-matches'
import { useLiveMatch } from '../hooks/use-live-match'
import { Countdown } from './countdown'
import { Scoreboard } from './scoreboard'
import { TimerBar } from './timer-bar'

type MatchBoardProps = {
  matchId: number
}

export function MatchBoard({ matchId }: MatchBoardProps) {
  const match = useMatch(matchId)
  const live = useLiveMatch(matchId)
  const myUserId = useMyUserId()
  const navigate = useNavigate()

  useEffect(() => {
    if (live.phase !== 'finished') return
    const timer = setTimeout(() => navigate(`/match/${matchId}/result`, { replace: true }), 1500)
    return () => clearTimeout(timer)
  }, [live.phase, matchId, navigate])

  if (match.isPending) return <Skeleton className="h-80 bg-secondary" />

  if (match.isError || live.errorCode === 'not_match_player' || live.errorCode === 'match_not_found') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">Ovaj meč ne postoji ili nisi njegov igrač.</p>
        <Link to="/friends" className="text-sm text-primary underline-offset-4 hover:underline">
          Nazad na prijatelje
        </Link>
      </div>
    )
  }

  const { player1, player2, topic } = match.data
  const meId = myUserId ?? player1.id
  const opponent = meId === player1.id ? player2 : player1
  const opponentName = opponent.displayName.split(' ')[0] ?? opponent.displayName
  const score = (id: number) => live.scores[String(id)] ?? 0

  if (live.phase === 'connecting' || live.phase === 'countdown') {
    return (
      <section className="flex flex-col gap-4">
        <Scoreboard
          me={{ name: 'Ti', score: 0 }}
          opponent={{ name: opponent.displayName, score: 0 }}
          index={0}
          total={0}
        />
        <Countdown startsAt={live.startsAt} topic={topic} />
      </section>
    )
  }

  const status = statusLine(live, meId, opponentName)

  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <Scoreboard
        me={{ name: 'Ti', score: score(meId) }}
        opponent={{ name: opponent.displayName, score: score(opponent.id) }}
        index={live.index}
        total={live.total}
      />

      {live.phase === 'finished' ? (
        <p className="py-10 text-center font-heading text-2xl font-bold">
          {live.winnerId === null
            ? 'Neriješeno!'
            : live.winnerId === meId
              ? 'Pobijedio si!'
              : `${opponentName} je pobijedio`}
        </p>
      ) : (
        <>
          <TimerBar endsAt={live.endsAt} paused={live.phase !== 'card'} />

          {live.card ? (
            <SegmentCard
              card={live.card}
              subject="other"
              selectedIndex={live.myAction?.kind === 'tap' ? live.myAction.index : null}
              lockedIndexes={live.lockedIndexes}
              reveal={
                live.end
                  ? { wrongIndex: live.end.card.wrongIndex, correctText: live.end.card.correctText }
                  : null
              }
              disabled={!live.canAnswer}
              shakeKey={live.myResult && !live.myResult.correct ? 1 : 0}
              onSelect={live.tap}
            />
          ) : null}

          {status ? (
            <p
              role="status"
              className={cn(
                'rounded-xl p-3 text-center text-sm font-semibold',
                status.tone === 'good' && 'bg-success-surface text-success-surface-foreground',
                status.tone === 'bad' && 'bg-wrong-surface text-wrong-surface-foreground',
                status.tone === 'neutral' && 'bg-secondary text-secondary-foreground',
              )}
            >
              {status.text}
            </p>
          ) : null}

          {live.end ? <AnswerReveal card={live.end.card} /> : null}

          {live.phase === 'card' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-12 flex-1 bg-transparent"
                disabled={!live.canAnswer}
                onClick={() => live.tap(null)}
              >
                Nema greške
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 flex-1"
                disabled={!live.canAnswer}
                onClick={live.dontKnow}
              >
                Ne znam
              </Button>
            </div>
          ) : null}
          {live.phase === 'card' && live.canAnswer ? (
            <p className="text-center text-xs text-muted-foreground">
              Tapni pogrešan dio. Prvi tačan odgovor nosi poene.
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}

type Status = { text: string; tone: 'good' | 'bad' | 'neutral' }

function statusLine(
  live: ReturnType<typeof useLiveMatch>,
  meId: number,
  opponentName: string,
): Status | null {
  if (live.opponentDisconnected) return { text: `${opponentName} je izgubio vezu…`, tone: 'neutral' }

  if (live.phase === 'card_end' && live.end) {
    if (live.end.winnerId === meId) {
      return { text: `Ti si bio brži! +${live.myResult?.points ?? 0}`, tone: 'good' }
    }
    if (live.end.winnerId !== null) return { text: `${opponentName} je bio brži`, tone: 'bad' }
    if (live.end.reason === 'timeout') return { text: 'Vrijeme je isteklo', tone: 'neutral' }
    return { text: 'Niko nije našao grešku', tone: 'neutral' }
  }

  if (live.myResult && !live.myResult.correct)
    return { text: `Pogrešno (${live.myResult.points}). Čekamo ${opponentName}…`, tone: 'bad' }
  if (live.myAction?.kind === 'dont_know') {
    return {
      text: live.opponentAction === null ? `Čekamo ${opponentName}…` : 'Ni protivnik ne zna',
      tone: 'neutral',
    }
  }
  if (live.opponentAction === 'wrong') return { text: `${opponentName} je pogriješio`, tone: 'neutral' }
  if (live.opponentAction === 'dont_know') return { text: `${opponentName} ne zna`, tone: 'neutral' }
  return null
}
