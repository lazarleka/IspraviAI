// One realtime connection per signed-in user (docs/entities.md, "Realtime").
// Real WebSocket is the default. Set VITE_REALTIME=mock only for an isolated frontend demo.
// The transport is generic: features narrow messages to their own types.
import { useEffect, useRef, useSyncExternalStore } from 'react'

import { useAuthToken } from '@/lib/auth-token'

export type RealtimeMessage = { type: string } & Record<string, unknown>
export type Emit = (message: RealtimeMessage) => void

export type MockServer = {
  /** Called when the client connects; the server answers with auth_ok through emit. */
  connect: (emit: Emit) => void
  handle: (message: RealtimeMessage, emit: Emit) => void
}

export const REALTIME_MODE: 'ws' | 'mock' = import.meta.env.VITE_REALTIME === 'mock' ? 'mock' : 'ws'

const PING_MS = 20_000
const MAX_BACKOFF_MS = 10_000
const AUTH_FAILED_CODE = 4401

const listeners = new Set<(message: RealtimeMessage) => void>()
const userIdListeners = new Set<() => void>()
let mockServer: MockServer | null = null
let socket: WebSocket | null = null
let connectedToken: string | null = null
let outbox: RealtimeMessage[] = []
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let pingTimer: ReturnType<typeof setInterval> | undefined
let attempt = 0
let myUserId: number | null = null

function setMyUserId(id: number | null) {
  myUserId = id
  for (const listener of userIdListeners) listener()
}

function dispatch(message: RealtimeMessage) {
  if (message.type === 'auth_ok' && typeof message.userId === 'number') setMyUserId(message.userId)
  for (const listener of listeners) listener(message)
}

function isMessage(value: unknown): value is RealtimeMessage {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}

function openSocket(token: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${protocol}://${window.location.host}/api/ws`)
  socket = ws

  ws.onopen = () => {
    attempt = 0
    ws.send(JSON.stringify({ type: 'auth', token }))
    for (const message of outbox) ws.send(JSON.stringify(message))
    outbox = []
    pingTimer = setInterval(() => send({ type: 'ping' }), PING_MS)
  }
  ws.onmessage = (event) => {
    try {
      const data: unknown = JSON.parse(String(event.data))
      if (isMessage(data)) dispatch(data)
    } catch {
      // Ignore anything that is not JSON.
    }
  }
  ws.onclose = (event) => {
    clearInterval(pingTimer)
    socket = null
    if (!connectedToken || event.code === AUTH_FAILED_CODE) return
    const backoff = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS)
    attempt += 1
    reconnectTimer = setTimeout(() => {
      if (connectedToken) openSocket(connectedToken)
    }, backoff)
  }
}

export function connect(token: string) {
  if (connectedToken === token) return
  disconnect()
  connectedToken = token
  if (REALTIME_MODE === 'ws') openSocket(token)
  else mockServer?.connect(dispatch)
}

export function disconnect() {
  connectedToken = null
  outbox = []
  clearTimeout(reconnectTimer)
  clearInterval(pingTimer)
  socket?.close()
  socket = null
  setMyUserId(null)
}

export function send(message: RealtimeMessage) {
  if (REALTIME_MODE === 'mock') {
    mockServer?.handle(message, dispatch)
    return
  }
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  else outbox.push(message)
}

export function subscribe(listener: (message: RealtimeMessage) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Mock mode only: a feature plugs in its fake server (e.g. the PvP bot). */
export function registerMockServer(server: MockServer) {
  mockServer = server
  if (REALTIME_MODE === 'mock' && connectedToken) server.connect(dispatch)
}

/** Opens the connection while a token exists. Call once, in the signed-in layout. */
export function useRealtimeConnection() {
  const token = useAuthToken()
  useEffect(() => {
    if (token) connect(token)
    else disconnect()
  }, [token])
}

/** Calls the latest handler for every server message while the component is mounted. */
export function useRealtimeMessages(handler: (message: RealtimeMessage) => void) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })
  useEffect(() => subscribe((message) => handlerRef.current(message)), [])
}

/** The signed-in user's id as the realtime server knows it (from auth_ok), or null before that. */
export function useMyUserId(): number | null {
  return useSyncExternalStore(
    (listener) => {
      userIdListeners.add(listener)
      return () => {
        userIdListeners.delete(listener)
      }
    },
    () => myUserId,
    () => myUserId,
  )
}
