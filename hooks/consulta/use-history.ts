'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Product, StoredProduct } from '@/lib/consulta/types'
import { STORAGE_KEYS, readJSON, writeJSON } from '@/lib/consulta/storage'

const MAX_HISTORY = 50

/**
 * Historial de los últimos productos consultados (persistente y disponible
 * offline). Deduplica por código y mantiene el más reciente al frente.
 */
export function useHistory() {
  const [history, setHistory] = useState<StoredProduct[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHistory(readJSON<StoredProduct[]>(STORAGE_KEYS.history, []))
    setHydrated(true)
  }, [])

  const persist = useCallback((next: StoredProduct[]) => {
    setHistory(next)
    writeJSON(STORAGE_KEYS.history, next)
  }, [])

  const add = useCallback(
    (product: Product) => {
      setHistory((prev) => {
        const entry: StoredProduct = { ...product, viewedAt: Date.now() }
        const next = [
          entry,
          ...prev.filter((p) => p.code !== product.code),
        ].slice(0, MAX_HISTORY)
        writeJSON(STORAGE_KEYS.history, next)
        return next
      })
    },
    [],
  )

  const remove = useCallback(
    (code: string) =>
      setHistory((prev) => {
        const next = prev.filter((p) => p.code !== code)
        writeJSON(STORAGE_KEYS.history, next)
        return next
      }),
    [],
  )

  const clear = useCallback(() => persist([]), [persist])

  return { history, add, remove, clear, hydrated }
}
