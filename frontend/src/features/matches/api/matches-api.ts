import { apiFetch, type Page } from '@/lib/api-client'

import type { Challenge, Match, MatchResult, NewChallenge } from '../types'

export const matchesApi = {
  createChallenge: (input: NewChallenge) =>
    apiFetch<Challenge>('/challenges', { method: 'POST', json: input }),
  cancelChallenge: (id: number) => apiFetch<void>(`/challenges/${id}`, { method: 'DELETE' }),
  acceptChallenge: (id: number) => apiFetch<Challenge>(`/challenges/${id}/accept`, { method: 'POST' }),
  declineChallenge: (id: number) => apiFetch<Challenge>(`/challenges/${id}/decline`, { method: 'POST' }),
  pendingChallenges: () => apiFetch<{ incoming: Challenge[]; outgoing: Challenge[] }>('/challenges/pending'),
  listMatches: () => apiFetch<Page<Match>>('/matches'),
  getMatch: (id: number) => apiFetch<Match>(`/matches/${id}`),
  getResult: (id: number) => apiFetch<MatchResult>(`/matches/${id}/result`),
}
