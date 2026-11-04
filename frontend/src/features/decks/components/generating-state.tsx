import { Loader2 } from 'lucide-react'

export function GeneratingState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-xl bg-secondary px-6 py-10 text-center"
    >
      <Loader2 className="size-10 text-primary motion-safe:animate-spin" aria-hidden="true" />
      <p className="font-heading text-lg font-bold">Pravim kartice…</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        AI čita gradivo i u svaku karticu sakriva po jednu grešku. Traje do 30 sekundi.
      </p>
    </div>
  )
}
