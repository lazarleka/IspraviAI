import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Swords } from 'lucide-react'
import { useNavigate } from 'react-router'

import { ChoiceChips } from '@/components/choice-chips'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PublicUser } from '@/lib/users'

import { useCancelChallenge, useCreateChallenge } from '../api/use-matches'
import { useChallengeUpdates } from '../hooks/use-challenge-updates'
import { MATCH_CARD_COUNTS, type Challenge } from '../types'

type ChallengeDialogProps = {
  opponent: PublicUser
  online: boolean
  initialTopic?: string
  triggerLabel?: string
  triggerClassName?: string
}

export function ChallengeDialog({
  opponent,
  online,
  initialTopic = '',
  triggerLabel = 'Izazovi',
  triggerClassName,
}: ChallengeDialogProps) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState(initialTopic)
  const [cardCount, setCardCount] = useState<number>(10)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<Challenge | null>(null)

  const createChallenge = useCreateChallenge()
  const cancelChallenge = useCancelChallenge()
  const challenge = useChallengeUpdates(sent)
  const navigate = useNavigate()

  // The opponent accepted: both players go to the match screen.
  useEffect(() => {
    if (challenge?.status === 'accepted' && challenge.matchId !== null) {
      navigate(`/match/${challenge.matchId}`)
    }
  }, [challenge, navigate])

  function onOpenChange(next: boolean) {
    if (!next && challenge?.status === 'pending') cancelChallenge.mutate(challenge.id)
    if (!next) {
      setSent(null)
      setError(null)
      createChallenge.reset()
    }
    setOpen(next)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = topic.trim()
    if (trimmed.length < 3 || trimmed.length > 200) {
      setError('Tema mora imati između 3 i 200 znakova.')
      return
    }
    setError(null)
    createChallenge.mutate({ opponentId: opponent.id, topic: trimmed, cardCount }, { onSuccess: setSent })
  }

  const firstName = opponent.displayName.split(' ')[0] ?? opponent.displayName
  const closed = challenge && ['declined', 'expired', 'cancelled'].includes(challenge.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!online}
          className={triggerClassName}
          title={online ? undefined : 'Prijatelj nije online'}
        >
          <Swords className="size-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle>Izazovi: {opponent.displayName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            AI pravi nove kartice za vašu temu. Ko prvi nađe grešku, nosi poene.
          </DialogDescription>
        </DialogHeader>

        {challenge ? (
          <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
            {closed ? (
              <>
                <p className="font-semibold">
                  {challenge.status === 'declined'
                    ? `${firstName} je odbio izazov.`
                    : challenge.status === 'expired'
                      ? 'Izazov je istekao.'
                      : 'Izazov je otkazan.'}
                </p>
                <Button variant="outline" onClick={() => setSent(null)}>
                  Pokušaj ponovo
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="size-8 text-primary motion-safe:animate-spin" aria-hidden="true" />
                <p className="font-semibold">
                  {challenge.deckStatus === 'generating'
                    ? 'AI pravi kartice…'
                    : `Čekam da ${firstName} prihvati…`}
                </p>
                <p className="text-sm text-muted-foreground">Tema: {challenge.topic}</p>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Otkaži izazov
                </Button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`challenge-topic-${opponent.id}`}>Tema</Label>
              <Input
                id={`challenge-topic-${opponent.id}`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Npr. Opšta kultura, Fotosinteza, Petlje u C-u"
                maxLength={200}
                className="h-11 bg-secondary"
              />
            </div>
            <ChoiceChips
              label="Broj kartica"
              options={MATCH_CARD_COUNTS}
              value={MATCH_CARD_COUNTS.find((n) => n === cardCount)}
              onChange={setCardCount}
            />
            {(error ?? createChallenge.error) ? (
              <p role="alert" className="text-sm text-destructive">
                {error ?? createChallenge.error?.message}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-12 text-base" disabled={createChallenge.isPending}>
              <Swords className="size-5" aria-hidden="true" />
              Pošalji izazov
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
