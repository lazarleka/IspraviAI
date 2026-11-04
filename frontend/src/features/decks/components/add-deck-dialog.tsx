import { ChevronRight, PenLine, Plus, Upload } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const OPTIONS = [
  {
    source: 'topic',
    icon: PenLine,
    title: 'Unesi temu',
    description: 'Napiši šta učiš, a AI napravi kartice.',
  },
  {
    source: 'file',
    icon: Upload,
    title: 'Ubaci skriptu',
    description: 'PDF, TXT ili MD, do 10 MB.',
  },
] as const

type AddDeckDialogProps = {
  /** "row" = the wide dashed button under the deck list, "button" = a normal button (empty state). */
  variant?: 'row' | 'button'
}

// "Dodaj karticu": asks how the new cards should be made, then opens the form with that choice.
export function AddDeckDialog({ variant = 'row' }: AddDeckDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'row' ? (
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Plus className="size-4" aria-hidden="true" />
            Dodaj karticu
          </button>
        ) : (
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            Dodaj karticu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle>Dodaj karticu</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Od čega da AI napravi kartice sa greškama?
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {OPTIONS.map(({ source, icon: Icon, title, description }) => (
            <li key={source}>
              <Link
                to={`/decks/new?source=${source}`}
                className={cn(
                  'flex min-h-16 items-center gap-3 rounded-xl bg-secondary p-3 text-secondary-foreground transition-colors',
                  'hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{title}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
