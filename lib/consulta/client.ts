import type { LookupResponse, Product } from './types'

/**
 * Fetchers de cliente: hablan SOLO con nuestro proxy /api/cugat, nunca con
 * cugat.cl directamente (CORS). Lanzan ProductNotFoundError para distinguir
 * "no existe" de "falló la red".
 */

export class ProductNotFoundError extends Error {
  constructor(public code: string) {
    super(`Producto no encontrado: ${code}`)
    this.name = 'ProductNotFoundError'
  }
}

async function getJSON(url: string, signal?: AbortSignal): Promise<LookupResponse> {
  const res = await fetch(url, { signal })
  if (res.status === 404) {
    return { product: null }
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar el catálogo.`)
  }
  return (await res.json()) as LookupResponse
}

/** Consulta un producto por código de barras. `null` si no existe. */
export async function fetchByCode(
  code: string,
  signal?: AbortSignal,
): Promise<Product> {
  const data = await getJSON(`/api/cugat?code=${encodeURIComponent(code)}`, signal)
  if (!data.product) throw new ProductNotFoundError(code)
  return data.product
}

/** Búsqueda por nombre para autocompletado. Devuelve [] si no hay query. */
export async function fetchByName(
  query: string,
  signal?: AbortSignal,
): Promise<Product[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const data = await getJSON(`/api/cugat?q=${encodeURIComponent(q)}`, signal)
  return data.results ?? []
}
