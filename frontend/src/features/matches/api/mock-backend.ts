// MOCK backend for challenges and live matches, used until the FastAPI backend has /api/challenges,
// /api/matches and /api/ws. It follows SPEC.md §6 and docs/entities.md: the server decides who was
// first, runs the 20 s timer, and sends the answer only in card_end. The opponent is a bot.
import { ApiError } from '@/lib/api-client'
import type { CardAnswer, CardQuestion } from '@/lib/cards'
import type { Emit, MockServer, RealtimeMessage } from '@/lib/realtime'
import type { PublicUser } from '@/lib/users'

import type { Challenge, Match, MatchAnswer, MatchMessage, MatchResult, NewChallenge, Scores } from '../types'
import { MOCK_MATCH_CARDS } from './mock-match-cards'

const ME: PublicUser = { id: 1, username: 'ti', displayName: 'Ti' }
const USERS: PublicUser[] = [
  { id: 2, username: 'marko_v', displayName: 'Marko Vuković' },
  { id: 3, username: 'jelena', displayName: 'Jelena Đurović' },
  { id: 4, username: 'nikola_r', displayName: 'Nikola Radonjić' },
  { id: 5, username: 'ana_p', displayName: 'Ana Petrović' },
]

const CARD_MS = 20_000
const BETWEEN_CARDS_MS = 3_000
const COUNTDOWN_MS = 3_000
const DECK_READY_MS = 1_200
const BOT_ACCEPTS_MS = 2_500

type PlayerCardState = { done: boolean; answer: MatchAnswer | null }

type Room = {
  match: Match
  cards: CardAnswer[]
  index: number
  cardStartedAt: number
  cardEnded: boolean
  players: Record<number, PlayerCardState>
  streaks: Record<number, number>
  timers: ReturnType<typeof setTimeout>[]
  answers: MatchAnswer[]
  started: boolean
  readyAt: number
}

const challenges = new Map<number, Challenge>()
const rooms = new Map<number, Room>()
let emitToClient: Emit = () => {}
let nextId = 100

function emit(
  message: MatchMessage | { type: 'challenge_updated' | 'challenge_received'; challenge: Challenge },
) {
  emitToClient(message as unknown as RealtimeMessage)
}

function later(room: Room | null, ms: number, fn: () => void) {
  const timer = setTimeout(fn, ms)
  room?.timers.push(timer)
}

function userById(id: number): PublicUser {
  const user = USERS.find((u) => u.id === id)
  if (!user) throw new ApiError(404, 'Korisnik ne postoji.', 'user_not_found')
  return user
}

function scoresOf(room: Room): Scores {
  return {
    [room.match.player1.id]: room.match.player1Score,
    [room.match.player2.id]: room.match.player2Score,
  }
}

function addPoints(room: Room, userId: number, points: number) {
  if (userId === room.match.player1.id) room.match.player1Score += points
  else room.match.player2Score += points
}

function question(card: CardAnswer): CardQuestion {
  return {
    id: card.id,
    deckId: card.deckId,
    kind: card.kind,
    language: card.language,
    segments: card.segments,
  }
}

function currentCard(room: Room): CardAnswer | undefined {
  return room.cards[room.index]
}

// --- Challenges (REST) --------------------------------------------------------------------------

function createChallenge(input: NewChallenge): Challenge {
  const opponent = userById(input.opponentId)
  const now = Date.now()
  const challenge: Challenge = {
    id: nextId++,
    challenger: ME,
    opponent,
    topic: input.topic,
    cardCount: input.cardCount,
    status: 'pending',
    deckStatus: 'generating',
    matchId: null,
    expiresAt: new Date(now + 2 * 60_000).toISOString(),
    createdAt: new Date(now).toISOString(),
  }
  challenges.set(challenge.id, challenge)

  // The "AI" finishes the deck, then the bot accepts.
  later(null, DECK_READY_MS, () => update(challenge.id, { deckStatus: 'ready' }))
  later(null, BOT_ACCEPTS_MS, () => {
    const current = challenges.get(challenge.id)
    if (current?.status !== 'pending') return
    const room = createRoom(current)
    update(challenge.id, { status: 'accepted', matchId: room.match.id })
  })
  return challenge
}

function update(id: number, changes: Partial<Challenge>) {
  const challenge = challenges.get(id)
  if (!challenge) return
  const next = { ...challenge, ...changes }
  challenges.set(id, next)
  emit({ type: 'challenge_updated', challenge: next })
}

function cancelChallenge(id: number) {
  const challenge = challenges.get(id)
  if (!challenge) throw new ApiError(404, 'Izazov ne postoji.', 'challenge_not_found')
  if (challenge.status === 'pending') update(id, { status: 'cancelled' })
}

function createRoom(challenge: Challenge): Room {
  const deckId = nextId++
  const cards = MOCK_MATCH_CARDS.slice(0, challenge.cardCount).map((card) => ({
    ...card,
    id: nextId++,
    deckId,
  }))
  const match: Match = {
    id: nextId++,
    challengeId: challenge.id,
    deckId,
    topic: challenge.topic,
    player1: challenge.challenger,
    player2: challenge.opponent,
    player1Score: 0,
    player2Score: 0,
    status: 'waiting',
    winnerId: null,
    startedAt: null,
    finishedAt: null,
  }
  const room: Room = {
    match,
    cards,
    index: 0,
    cardStartedAt: 0,
    cardEnded: false,
    players: {},
    streaks: { [match.player1.id]: 0, [match.player2.id]: 0 },
    timers: [],
    answers: [],
    started: false,
    readyAt: 0,
  }
  rooms.set(match.id, room)
  return room
}

// --- Live match -----------------------------------------------------------------------------------

function startCard(room: Room) {
  const card = currentCard(room)
  if (!card) return finishMatch(room)
  room.cardStartedAt = Date.now()
  room.cardEnded = false
  room.players = {
    [room.match.player1.id]: { done: false, answer: null },
    [room.match.player2.id]: { done: false, answer: null },
  }
  emit({
    type: 'card_start',
    matchId: room.match.id,
    index: room.index,
    total: room.cards.length,
    card: question(card),
    endsAt: new Date(room.cardStartedAt + CARD_MS).toISOString(),
  })
  later(room, CARD_MS, () => endCard(room, null, 'timeout'))
  scheduleBot(room, card)
}

function scheduleBot(room: Room, card: CardAnswer) {
  const bot = room.match.player2.id
  const thinkMs = 3_000 + Math.random() * 9_000
  later(room, thinkMs, () => {
    if (room.cardEnded || currentCard(room)?.id !== card.id) return
    const roll = Math.random()
    if (roll < 0.5) {
      answer(room, bot, card.wrongIndex)
    } else if (roll < 0.7) {
      const wrongPick = card.segments.findIndex((_, i) => i !== card.wrongIndex)
      answer(room, bot, card.wrongIndex === null ? 0 : wrongPick)
    } else {
      dontKnow(room, bot)
    }
  })
}

function record(room: Room, entry: MatchAnswer) {
  room.answers.push(entry)
  const state = room.players[entry.userId]
  if (state) {
    state.done = true
    state.answer = entry
  }
}

// selectedIndex null = "the card has no error"
function answer(room: Room, userId: number, selectedIndex: number | null) {
  const card = currentCard(room)
  const state = room.players[userId]
  if (!card || room.cardEnded || !state || state.done) return

  const responseMs = Date.now() - room.cardStartedAt
  const correct = selectedIndex === card.wrongIndex
  const remaining = Math.max(0, CARD_MS - responseMs)
  let points = correct ? 10 + Math.round((5 * remaining) / CARD_MS) : -5

  if (correct) {
    room.streaks[userId] = (room.streaks[userId] ?? 0) + 1
    if ((room.streaks[userId] ?? 0) % 3 === 0) points += 5
  }
  addPoints(room, userId, points)
  record(room, { cardId: card.id, userId, action: 'tap', selectedIndex, correct, responseMs, points })

  if (userId === ME.id)
    emit({ type: 'answer_result', matchId: room.match.id, cardId: card.id, correct, points })
  else if (!correct)
    emit({ type: 'opponent_action', matchId: room.match.id, cardId: card.id, action: 'wrong' })

  if (correct) endCard(room, userId, 'correct')
  else if (allDone(room)) endCard(room, null, 'both_done')
}

function dontKnow(room: Room, userId: number) {
  const card = currentCard(room)
  const state = room.players[userId]
  if (!card || room.cardEnded || !state || state.done) return
  record(room, {
    cardId: card.id,
    userId,
    action: 'dont_know',
    selectedIndex: null,
    correct: false,
    responseMs: Date.now() - room.cardStartedAt,
    points: 0,
  })
  if (userId !== ME.id)
    emit({ type: 'opponent_action', matchId: room.match.id, cardId: card.id, action: 'dont_know' })
  if (allDone(room)) endCard(room, null, 'both_done')
}

function allDone(room: Room) {
  return Object.values(room.players).every((p) => p.done)
}

function endCard(room: Room, winnerId: number | null, reason: 'correct' | 'both_done' | 'timeout') {
  const card = currentCard(room)
  if (!card || room.cardEnded) return
  room.cardEnded = true
  for (const timer of room.timers) clearTimeout(timer)
  room.timers = []

  // A player who did not win the card loses their streak.
  for (const id of [room.match.player1.id, room.match.player2.id]) {
    if (id !== winnerId) room.streaks[id] = 0
    const state = room.players[id]
    if (state && !state.done) {
      record(room, {
        cardId: card.id,
        userId: id,
        action: 'timeout',
        selectedIndex: null,
        correct: false,
        responseMs: null,
        points: 0,
      })
    }
  }

  emit({
    type: 'card_end',
    matchId: room.match.id,
    cardId: card.id,
    winnerId,
    reason,
    card,
    scores: scoresOf(room),
  })
  later(room, BETWEEN_CARDS_MS, () => {
    room.index += 1
    startCard(room)
  })
}

function finishMatch(room: Room) {
  const { match } = room
  match.status = 'finished'
  match.finishedAt = new Date().toISOString()
  match.winnerId =
    match.player1Score === match.player2Score
      ? null
      : match.player1Score > match.player2Score
        ? match.player1.id
        : match.player2.id
  emit({
    type: 'match_end',
    matchId: match.id,
    winnerId: match.winnerId,
    status: match.status,
    scores: scoresOf(room),
  })
}

function join(matchId: number) {
  const room = rooms.get(matchId)
  if (!room) {
    emitToClient({ type: 'error', code: 'match_not_found', detail: 'Meč ne postoji.' })
    return
  }
  if (room.match.status === 'finished') {
    emit({
      type: 'match_end',
      matchId,
      winnerId: room.match.winnerId,
      status: room.match.status,
      scores: scoresOf(room),
    })
    return
  }
  if (room.started) {
    // Rejoin: repeat the countdown, or send the current card again.
    const card = currentCard(room)
    if (room.cardStartedAt === 0) {
      emit({ type: 'match_ready', matchId, startsAt: new Date(room.readyAt).toISOString() })
    } else if (card && !room.cardEnded) {
      emit({
        type: 'card_start',
        matchId,
        index: room.index,
        total: room.cards.length,
        card: question(card),
        endsAt: new Date(room.cardStartedAt + CARD_MS).toISOString(),
      })
    }
    return
  }
  room.started = true
  room.readyAt = Date.now() + COUNTDOWN_MS
  room.match.status = 'in_progress'
  room.match.startedAt = new Date().toISOString()
  emit({ type: 'match_ready', matchId, startsAt: new Date(room.readyAt).toISOString() })
  later(room, COUNTDOWN_MS, () => startCard(room))
}

function numberField(message: RealtimeMessage, key: string): number | null {
  const value = message[key]
  return typeof value === 'number' ? value : null
}

export const mockMatchServer: MockServer = {
  connect: (emitFn) => {
    emitToClient = emitFn
    emitFn({ type: 'auth_ok', userId: ME.id })
  },
  handle: (message, emitFn) => {
    emitToClient = emitFn
    const matchId = numberField(message, 'matchId')
    const room = matchId === null ? undefined : rooms.get(matchId)
    if (message.type === 'match_join' && matchId !== null) join(matchId)
    if (!room) return
    const cardId = numberField(message, 'cardId')
    if (cardId !== currentCard(room)?.id) return
    if (message.type === 'match_tap') answer(room, ME.id, numberField(message, 'selectedIndex'))
    if (message.type === 'match_dont_know') dontKnow(room, ME.id)
  },
}

export const mockMatchRest = {
  createChallenge,
  cancelChallenge,
  getChallenge: (id: number) => {
    const challenge = challenges.get(id)
    if (!challenge) throw new ApiError(404, 'Izazov ne postoji.', 'challenge_not_found')
    return challenge
  },
  getMatch: (id: number): Match => {
    const room = rooms.get(id)
    if (!room) throw new ApiError(404, 'Meč ne postoji.', 'match_not_found')
    return { ...room.match }
  },
  getResult: (id: number): MatchResult => {
    const room = rooms.get(id)
    if (!room) throw new ApiError(404, 'Meč ne postoji.', 'match_not_found')
    if (room.match.status !== 'finished') throw new ApiError(409, 'Meč još traje.', 'match_not_finished')
    return {
      match: { ...room.match },
      cards: room.cards.map((card) => ({ card, answers: room.answers.filter((a) => a.cardId === card.id) })),
    }
  },
}
