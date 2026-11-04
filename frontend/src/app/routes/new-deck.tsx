import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { NewDeckForm } from '@/features/decks/components/new-deck-form'

export function NewDeck() {
  const navigate = useNavigate()

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
        <h1 className="text-2xl font-bold">Novi špil</h1>
        <p className="text-sm text-muted-foreground">
          Napiši temu ili ubaci skriptu. AI pravi kartice i u svaku sakriva jednu grešku.
        </p>
      </div>
      <NewDeckForm onCreated={(deck) => navigate(`/decks/${deck.id}`)} />
    </section>
  )
}
