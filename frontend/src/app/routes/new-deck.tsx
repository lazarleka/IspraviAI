import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { NewDeckForm } from '@/features/decks/components/new-deck-form'

export function NewDeck() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const source = params.get('source') === 'file' ? 'file' : 'topic'

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Nazad
        </Link>
        <h1 className="text-2xl font-bold">Dodaj karticu</h1>
        <p className="text-sm text-muted-foreground">
          {source === 'file'
            ? 'Ubaci skriptu, a AI od nje pravi kartice i u svaku sakriva jednu grešku.'
            : 'Unesi temu, a AI pravi kartice i u svaku sakriva jednu grešku.'}
        </p>
      </div>
      <NewDeckForm key={source} initialSource={source} onCreated={(deck) => navigate(`/decks/${deck.id}`)} />
    </section>
  )
}
