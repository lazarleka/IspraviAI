import { useState } from 'react'

import { useRealtimeMessages } from '@/lib/realtime'

import { asChallengeMessage, type Challenge } from '../types'

/** The latest state of one challenge, as pushed by the server (challenge_updated). */
export function useChallengeUpdates(challenge: Challenge | null): Challenge | null {
  const [latest, setLatest] = useState<Challenge | null>(null)

  useRealtimeMessages((message) => {
    const update = asChallengeMessage(message)
    if (update?.type === 'challenge_updated' && update.challenge.id === challenge?.id)
      setLatest(update.challenge)
  })

  if (!challenge) return null
  return latest?.id === challenge.id ? latest : challenge
}

/** Challenges other users send me while I am signed in (challenge_received). */
export function useIncomingChallenges() {
  const [incoming, setIncoming] = useState<Challenge[]>([])

  useRealtimeMessages((message) => {
    const update = asChallengeMessage(message)
    if (!update) return
    if (update.type === 'challenge_received') {
      setIncoming((list) => [...list.filter((c) => c.id !== update.challenge.id), update.challenge])
    } else if (update.challenge.status !== 'pending') {
      setIncoming((list) => list.filter((c) => c.id !== update.challenge.id))
    }
  })

  const dismiss = (id: number) => setIncoming((list) => list.filter((c) => c.id !== id))
  return { incoming, dismiss }
}
