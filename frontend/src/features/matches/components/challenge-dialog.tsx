import { useEffect, useState, type FormEvent } from 'react'
import { FileUp, Layers3, Lightbulb, Loader2, Swords, Upload } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PublicUser } from '@/lib/users'
import { cn } from '@/lib/utils'

import { useChallengeDecks, useUploadChallengeScript, type ChallengeDeck } from '../api/use-challenge-sources'
import { useCancelChallenge, useCreateChallenge } from '../api/use-matches'
import { useChallengeUpdates } from '../hooks/use-challenge-updates'
import { MATCH_CARD_COUNTS, type Challenge } from '../types'

type ChallengeSource = 'deck' | 'topic' | 'file'

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
  const [source, setSource] = useState<ChallengeSource>(initialTopic ? 'topic' : 'deck')
  const [topic, setTopic] = useState(initialTopic)
  const [deckId, setDeckId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [cardCount, setCardCount] = useState<number>(10)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<Challenge | null>(null)

  const decks = useChallengeDecks()
  const uploadDeck = useUploadChallengeScript()
  const createChallenge = useCreateChallenge()
  const cancelChallenge = useCancelChallenge()
  const challenge = useChallengeUpdates(sent)
  const navigate = useNavigate()
  const readyDecks = decks.data?.items.filter((deck) => deck.status === 'ready' && deck.cardCount >= 5) ?? []
  const selectedDeck = readyDecks.find((deck) => deck.id === deckId)
  const availableCounts = MATCH_CARD_COUNTS.filter(
    (count) => source !== 'deck' || !selectedDeck || count <= selectedDeck.cardCount,
  )
  const pending = createChallenge.isPending || uploadDeck.isPending

  useEffect(() => {
    if (challenge?.status === 'accepted' && challenge.matchId !== null) {
      navigate(`/match/${challenge.matchId}`)
    }
  }, [challenge, navigate])

  useEffect(() => {
    if (deckId === null && readyDecks[0]) setDeckId(readyDecks[0].id)
  }, [deckId, readyDecks])

  function onOpenChange(next: boolean) {
    if (!next && challenge?.status === 'pending') cancelChallenge.mutate(challenge.id)
    if (!next) {
      setSent(null)
      setError(null)
      createChallenge.reset()
      uploadDeck.reset()
    }
    setOpen(next)
  }

  function selectDeck(deck: ChallengeDeck) {
    setDeckId(deck.id)
    const validCounts = MATCH_CARD_COUNTS.filter((count) => count <= deck.cardCount)
    if (!validCounts.includes(cardCount as (typeof MATCH_CARD_COUNTS)[number])) {
      setCardCount(validCounts.at(-1) ?? 5)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      let selectedDeckId = deckId
      if (source === 'topic') {
        const trimmed = topic.trim()
        if (trimmed.length < 3 || trimmed.length > 200) {
          setError('Tema mora imati između 3 i 200 znakova.')
          return
        }
        const created = await createChallenge.mutateAsync({
          opponentId: opponent.id,
          topic: trimmed,
          cardCount,
        })
        setSent(created)
        return
      }

      if (source === 'file') {
        if (!file) {
          setError('Izaberi PDF, TXT ili MD skriptu.')
          return
        }
        const uploaded = await uploadDeck.mutateAsync({ file, requestedCards: cardCount })
        selectedDeckId = uploaded.id
      }

      if (selectedDeckId === null) {
        setError('Izaberi jedan od svojih spremnih špilova.')
        return
      }
      const created = await createChallenge.mutateAsync({
        opponentId: opponent.id,
        deckId: selectedDeckId,
        cardCount,
      })
      setSent(created)
    } catch {
      // Mutation errors are rendered below with the message returned by the API.
    }
  }

  const firstName = opponent.displayName.split(' ')[0] ?? opponent.displayName
  const closed = challenge && ['declined', 'expired', 'cancelled'].includes(challenge.status)
  const requestError = createChallenge.error ?? uploadDeck.error

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
      <DialogContent className="max-h-[90dvh] overflow-x-hidden overflow-y-auto border-border bg-background sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Izazovi: {opponent.displayName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Izaberi svoj špil ili napravi kartice iz teme ili skripte.
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
                <p className="text-sm text-muted-foreground">
                  {challenge.topic} · {challenge.cardCount} kartica
                </p>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Otkaži izazov
                </Button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Tabs
              value={source}
              onValueChange={(value) => {
                setSource(value as ChallengeSource)
                setError(null)
              }}
            >
              <TabsList className="grid h-12 w-full grid-cols-3">
                <TabsTrigger value="deck">
                  <Layers3 />
                  Moj špil
                </TabsTrigger>
                <TabsTrigger value="topic">
                  <Lightbulb />
                  Tema
                </TabsTrigger>
                <TabsTrigger value="file">
                  <FileUp />
                  Skripta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deck" className="mt-4">
                {decks.isPending ? (
                  <p className="text-sm text-muted-foreground">Učitavam tvoje špilove…</p>
                ) : readyDecks.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Nemaš spreman špil. Izaberi temu ili učitaj skriptu.
                  </div>
                ) : (
                  <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="sr-only">Izaberi špil</legend>
                    {readyDecks.map((deck) => (
                      <button
                        key={deck.id}
                        type="button"
                        aria-pressed={deckId === deck.id}
                        onClick={() => selectDeck(deck)}
                        className={cn(
                          'rounded-xl border bg-secondary p-3 text-left transition-colors',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          deckId === deck.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary',
                        )}
                      >
                        <span className="block truncate font-semibold">{deck.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {deck.cardCount} kartica · {deck.sourceType === 'file' ? 'skripta' : 'tema'}
                        </span>
                      </button>
                    ))}
                  </fieldset>
                )}
              </TabsContent>

              <TabsContent value="topic" className="mt-4 flex flex-col gap-2">
                <Label htmlFor={`challenge-topic-${opponent.id}`}>Tema za nove kartice</Label>
                <Input
                  id={`challenge-topic-${opponent.id}`}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Npr. Fotosinteza ili Petlje u C-u"
                  maxLength={200}
                  className="h-11 bg-secondary"
                />
              </TabsContent>

              <TabsContent value="file" className="mt-4">
                <Label
                  htmlFor={`challenge-file-${opponent.id}`}
                  className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-secondary p-4 text-center hover:border-primary"
                >
                  <Upload className="size-6 text-primary" aria-hidden="true" />
                  <span className="font-semibold">{file?.name ?? 'Izaberi skriptu'}</span>
                  <span className="text-xs text-muted-foreground">PDF, TXT ili MD · do 10 MB</span>
                </Label>
                <Input
                  id={`challenge-file-${opponent.id}`}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </TabsContent>
            </Tabs>

            <ChoiceChips
              label="Broj kartica"
              options={availableCounts}
              value={availableCounts.find((count) => count === cardCount)}
              onChange={setCardCount}
              format={(count) => `${count} kartica`}
            />
            {(error ?? requestError) ? (
              <p role="alert" className="text-sm text-destructive">
                {error ?? requestError?.message}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
              {pending ? (
                <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Swords className="size-5" aria-hidden="true" />
              )}
              {source === 'file' && uploadDeck.isPending ? 'Učitavam skriptu…' : 'Pošalji izazov'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
