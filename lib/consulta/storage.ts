/**
 * Acceso seguro a localStorage (tolerante a SSR y modo privado).
 * Centraliza las claves para no dispersar strings mágicos por la app.
 */

export const STORAGE_KEYS = {
  history: 'cugat:consulta:history',
  favorites: 'cugat:consulta:favorites',
  theme: 'cugat:consulta:theme',
} as const

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* cuota llena o modo privado: degradamos silenciosamente */
  }
}

export function readString(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}
