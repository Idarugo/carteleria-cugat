'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Product, StoredProduct } from '@/lib/consulta/types'
import { STORAGE_KEYS, readJSON, writeJSON } from '@/lib/consulta/storage'

/** Productos marcados como favoritos (persistentes, disponibles offline). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<StoredProduct[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setFavorites(readJSON<StoredProduct[]>(STORAGE_KEYS.favorites, []))
    setHydrated(true)
  }, [])

  const codes = useMemo(
    () => new Set(favorites.map((f) => f.code)),
    [favorites],
  )

  const isFavorite = useCallback((code: string) => codes.has(code), [codes])

  const toggle = useCallback((product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.code === product.code)
      const next = exists
        ? prev.filter((p) => p.code !== product.code)
        : [{ ...product, viewedAt: Date.now() }, ...prev]
      writeJSON(STORAGE_KEYS.favorites, next)
      return next
    })
  }, [])

  const remove = useCallback(
    (code: string) =>
      setFavorites((prev) => {
        const next = prev.filter((p) => p.code !== code)
        writeJSON(STORAGE_KEYS.favorites, next)
        return next
      }),
    [],
  )

  const clear = useCallback(() => {
    setFavorites([])
    writeJSON(STORAGE_KEYS.favorites, [])
  }, [])

  return { favorites, isFavorite, toggle, remove, clear, hydrated }
}
