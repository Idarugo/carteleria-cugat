'use client'

import { useCallback, useEffect, useState } from 'react'

import { STORAGE_KEYS, readString, writeString } from '@/lib/consulta/storage'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Aplica el tema usando el esquema de clases de globals.css:
 *  - 'dark'   → clase .dark
 *  - 'light'  → clase .light
 *  - 'system' → sin clase (responde a prefers-color-scheme)
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme === 'dark') root.classList.add('dark')
  else if (theme === 'light') root.classList.add('light')
}

function resolvedIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = readString(STORAGE_KEYS.theme) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored)
      applyTheme(stored)
    }
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    writeString(STORAGE_KEYS.theme, next)
  }, [])

  /** Alterna claro/oscuro de forma explícita (ignora 'system'). */
  const toggle = useCallback(() => {
    setTheme(resolvedIsDark(theme) ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle, isDark: resolvedIsDark(theme) }
}
