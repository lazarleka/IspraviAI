// The JWT from /api/auth/login or /register. Kept in memory and in localStorage, so a reload keeps
// the user signed in. Components read it through `useAuthToken()` and re-render when it changes.
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ispravi-ai.token'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let token: string | null = readStoredToken()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function getToken(): string | null {
  return token
}

export function setToken(value: string) {
  token = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Private mode or blocked storage: the token still lives in memory for this tab.
  }
  emit()
}

export function clearToken() {
  token = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getToken, getToken)
}
