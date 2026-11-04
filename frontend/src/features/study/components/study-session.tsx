import { Flag } from 'lucide-react'
import { Link } from 'react-router'

import { AnswerReveal } from '@/components/card/answer-reveal'
import { SegmentCard } from '@/components/card/segment-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CardQuestion } from '@/lib/cards'
import type { Subject } from '@/lib/subjects'

import { useReportCard, useStudyCards } from '../api/use-study'
import { useStudySession } from '../hooks/use-study-session'
import { ResultBanner } from './result-banner'
import { SessionSummary } from './session-summary'
import { StudyHeader } from './study-header'

type StudySessionProps = {
  deckId: number
  subject: Subject
}

export function StudySession({ deckId, subject }: StudySessionProps) {
  const cards = useStudyCards(deckId)

  if (cards.isPending || cards.isFetching) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Učitavam kartice">
        <Skeleton className="h-8 bg-secondary" />
        <Skeleton className="h-40 bg-secondary" />
        <Skeleton className="h-12 bg-secondary" />
      </div>
    )
  }

  if (cards.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">Ne mogu da učitam kartice. {cards.error.message}</p>
        <Button variant="outline" onClick={() => cards.refetch()}>
          Pokušaj ponovo
        </Button>
      </div>
    )
  }

  // A new key starts a fresh session (state reset) after "Još jedna runda".
  return (
    <StudyRun
      key={cards.dataUpdatedAt}
      cards={cards.data.items}
      subject={subject}
      onRestart={() => cards.refetch()}
    />
  )
}

type StudyRunProps = {
  cards: CardQuestion[]
  subject: Subject
  onRestart: () => void
}

function StudyRun({ cards, subject, onRestart }: StudyRunProps) {
  const session = useStudySession(cards)
  const report = useReportCard()

  if (session.phase === 'done' || !session.card) {
    return <SessionSummary totals={session.totals} total={session.total} onRestart={onRestart} />
  }

  const { card, phase, revealed } = session
  const canAnswer = phase === 'choose' || phase === 'retry'

  return (
    <section className="flex flex-col gap-4">
      <StudyHeader
        subject={subject}
        index={session.index}
        total={session.total}
        points={session.totals.points}
      />

      <h1 className="text-lg font-semibold">{phase === 'revealed' ? 'Rješenje' : 'Nađi grešku'}</h1>

      <SegmentCard
        card={card}
        subject={subject}
        selectedIndex={session.selectedIndex}
        lockedIndexes={session.lockedIndexes}
        reveal={revealed ? { wrongIndex: revealed.wrongIndex, correctText: revealed.correctText } : null}
        disabled={!canAnswer || session.isSubmitting}
        shakeKey={session.shakeKey}
        onSelect={session.select}
      />

      {phase === 'retry' ? <ResultBanner kind="retry" /> : null}
      {phase === 'revealed' ? (
        <ResultBanner
          kind="result"
          correct={session.lastCorrect}
          points={session.lastPoints}
          firstTry={session.lastPoints === 10}
        />
      ) : null}
      {revealed ? <AnswerReveal card={revealed} /> : null}

      {session.submitError ? (
        <p role="alert" className="text-sm text-destructive">
          {session.submitError.message}
        </p>
      ) : null}

      <div className="sticky bottom-20 mt-2 flex gap-2 bg-background pt-2">
        {canAnswer ? (
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-12 flex-1 bg-transparent"
              disabled={session.isSubmitting || session.triedNoError}
              onClick={() => session.submit(null)}
            >
              Nema greške
            </Button>
            <Button
              size="lg"
              className="h-12 flex-1 text-base"
              disabled={session.isSubmitting || session.selectedIndex === null}
              onClick={() => session.submit(session.selectedIndex)}
            >
              Provjeri
            </Button>
          </>
        ) : (
          <Button size="lg" className="h-12 flex-1 text-base" onClick={session.next}>
            {session.index + 1 >= session.total ? 'Završi' : 'Sljedeća kartica'}
          </Button>
        )}
      </div>

      {phase === 'revealed' ? (
        <Button
          variant="link"
          size="sm"
          className="self-center text-muted-foreground"
          disabled={report.isPending || report.isSuccess}
          onClick={() => report.mutate(card.id)}
        >
          <Flag className="size-3.5" aria-hidden="true" />
          {report.isSuccess ? 'Kartica prijavljena' : 'Prijavi karticu'}
        </Button>
      ) : null}

      <Link to="/" className="self-center text-xs text-muted-foreground underline-offset-4 hover:underline">
        Prekini učenje
      </Link>
    </section>
  )
}
