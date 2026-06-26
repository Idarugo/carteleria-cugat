'use client'

import { useEffect, useState } from 'react'

/** Devuelve el valor con `delay` ms de retardo. Útil para búsqueda en vivo. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
