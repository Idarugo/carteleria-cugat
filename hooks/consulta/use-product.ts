'use client'

import { useQuery } from '@tanstack/react-query'

import {
  ProductNotFoundError,
  fetchByCode,
  fetchByName,
} from '@/lib/consulta/client'
import { useDebounce } from './use-debounce'

/**
 * Consulta un producto por código de barras. React Query nos da caché,
 * deduplicación de peticiones idénticas, reintentos y estados de carga.
 */
export function useProduct(code: string | null) {
  return useQuery({
    queryKey: ['cugat', 'product', code],
    queryFn: ({ signal }) => fetchByCode(code as string, signal),
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // No reintentar si el producto simplemente no existe.
    retry: (failureCount, error) =>
      !(error instanceof ProductNotFoundError) && failureCount < 2,
  })
}

/** Búsqueda por nombre con debounce para autocompletado en vivo. */
export function useProductSearch(query: string) {
  const debounced = useDebounce(query.trim(), 320)
  return useQuery({
    queryKey: ['cugat', 'search', debounced],
    queryFn: ({ signal }) => fetchByName(debounced, signal),
    enabled: debounced.length >= 2,
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
