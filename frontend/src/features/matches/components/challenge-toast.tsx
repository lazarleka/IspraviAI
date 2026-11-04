import { Swords } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'

import { useAcceptChallenge, useDeclineChallenge } from '../api/use-matches'
import { useIncomingChallenges } from '../hooks/use-challenge-updates'

// Shown on every signed-in screen when a friend challenges you (challenge_received).
export function ChallengeToast() {
  const { incoming, dismiss } = useIncomingChallenges()
  const accept = useAcceptChallenge()
  const decline = useDeclineChallenge()
  const navigate = useNavigate()

  const challenge = incoming[0]
  if (!challenge) return null

  return (
    <div
      role="alertdialog"
      aria-label="Novi izazov"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-xl border border-primary bg-secondary p-4"
    >
      <p className="flex items-center gap-2 text-sm">
        <Swords className="size-5 text-primary" aria-hidden="true" />
        <span>
          <strong className="font-semibold">{challenge.challenger.displayName}</strong> te izaziva:{' '}
          {challenge.topic}, {challenge.cardCount} kartica
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          disabled={decline.isPending}
          onClick={() => decline.mutate(challenge.id, { onSettled: () => dismiss(challenge.id) })}
        >
          Odbij
        </Button>
        <Button
          className="flex-1"
          disabled={accept.isPending}
          onClick={() =>
            accept.mutate(challenge.id, {
              onSuccess: (accepted) => {
                dismiss(challenge.id)
                if (accepted.matchId !== null) navigate(`/match/${accepted.matchId}`)
              },
            })
          }
        >
          Prihvati
        </Button>
      </div>
    </div>
  )
}
