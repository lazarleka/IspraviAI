// MOCK until the backend has /api/challenges and /api/matches (docs/entities.md, "Challenge", "Match").
// Swap each body for apiFetch(...) when the routes exist; the live part moves to VITE_REALTIME=ws.
import { delay } from '@/lib/mock-db'
import { REALTIME_MODE, registerMockServer } from '@/lib/realtime'

import type { NewChallenge } from '../types'
import { mockMatchRest, mockMatchServer } from './mock-backend'

if (REALTIME_MODE === 'mock') registerMockServer(mockMatchServer)

function run<T>(fn: () => T): Promise<T> {
  try {
    return delay(fn())
  } catch (error) {
    return Promise.reject(error)
  }
}

export const matchesApi = {
  createChallenge: (input: NewChallenge) => run(() => mockMatchRest.createChallenge(input)),
  cancelChallenge: (id: number) => run(() => mockMatchRest.cancelChallenge(id)),
  // Incoming challenges never happen against the bot; with the real backend these call
  // POST /api/challenges/:id/accept and /decline.
  acceptChallenge: (id: number) => run(() => mockMatchRest.getChallenge(id)),
  declineChallenge: (id: number) => run(() => mockMatchRest.getChallenge(id)),
  getMatch: (id: number) => run(() => mockMatchRest.getMatch(id)),
  getResult: (id: number) => run(() => mockMatchRest.getResult(id)),
}
