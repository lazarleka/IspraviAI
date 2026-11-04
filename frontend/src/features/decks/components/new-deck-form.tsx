import { useState, type FormEvent } from 'react'
import { FileText, Upload } from 'lucide-react'

import { ChoiceChips } from '@/components/choice-chips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SUBJECTS, SUBJECT_LABELS, type Subject } from '@/lib/subjects'

import { useCreateDeck, useUploadDeck } from '../api/use-decks'
import { CARD_COUNT_OPTIONS, type Deck } from '../types'

type Source = 'topic' | 'file'

type NewDeckFormProps = {
  onCreated: (deck: Deck) => void
}

export function NewDeckForm({ onCreated }: NewDeckFormProps) {
  const [source, setSource] = useState<Source>('topic')
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState<Subject | undefined>(undefined)
  const [requestedCards, setRequestedCards] = useState<number>(10)
  const [validationError, setValidationError] = useState<string | null>(null)

  const createDeck = useCreateDeck()
  const uploadDeck = useUploadDeck()
  const pending = createDeck.isPending || uploadDeck.isPending
  const apiError = source === 'topic' ? createDeck.error : uploadDeck.error

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (source === 'topic') {
      const trimmed = topic.trim()
      if (trimmed.length < 3 || trimmed.length > 200) {
        setValidationError('Tema mora imati između 3 i 200 znakova.')
        return
      }
      createDeck.mutate({ topic: trimmed, subject, requestedCards }, { onSuccess: onCreated })
      return
    }

    if (!file) {
      setValidationError('Izaberi fajl sa skriptom.')
      return
    }
    uploadDeck.mutate({ file, subject, requestedCards }, { onSuccess: onCreated })
  }

  const error = validationError ?? apiError?.message ?? null

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Tabs value={source} onValueChange={(value) => setSource(value === 'file' ? 'file' : 'topic')}>
        <TabsList className="grid h-11 w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="topic" className="h-full">
            Tema
          </TabsTrigger>
          <TabsTrigger value="file" className="h-full">
            Skripta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="mt-4 flex flex-col gap-2">
          <Label htmlFor="topic">Šta učiš?</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Fotosinteza, Prvi srpski ustanak, rekurzija u C-u…"
            maxLength={200}
            className="h-11 bg-secondary"
          />
        </TabsContent>

        <TabsContent value="file" className="mt-4">
          <label
            htmlFor="file"
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary p-4 text-center transition-colors hover:bg-secondary focus-within:ring-2 focus-within:ring-ring"
          >
            {file ? (
              <>
                <FileText className="size-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold break-all">{file.name}</span>
                <span className="text-xs text-muted-foreground">Klikni da izabereš drugi fajl</span>
              </>
            ) : (
              <>
                <Upload className="size-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold">Izaberi skriptu</span>
                <span className="text-xs text-muted-foreground">PDF, TXT ili MD, do 10 MB</span>
              </>
            )}
            <input
              id="file"
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </TabsContent>
      </Tabs>

      <ChoiceChips
        label="Broj kartica"
        options={CARD_COUNT_OPTIONS}
        value={CARD_COUNT_OPTIONS.find((n) => n === requestedCards)}
        onChange={setRequestedCards}
      />

      <ChoiceChips
        label="Predmet (neobavezno, AI pogađa sam)"
        options={SUBJECTS}
        value={subject}
        onChange={(value) => setSubject(value === subject ? undefined : value)}
        format={(value) => SUBJECT_LABELS[value]}
      />

      {error ? (
        <p role="alert" className="rounded-md bg-wrong-surface p-3 text-sm text-wrong-surface-foreground">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
        {pending ? 'Šaljem…' : 'Napravi kartice'}
      </Button>
    </form>
  )
}
