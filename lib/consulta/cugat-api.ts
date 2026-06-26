import type { CugatProduct, Product } from './types'
import { normalizeProduct } from './normalize'
import { normalizeCode } from './format'

/**
 * Cliente server-side de la WooCommerce Store API de Cugat.
 *
 * Vive solo en el servidor (Route Handler) por dos razones:
 *  1. CORS — la API no expone Access-Control-Allow-Origin, así que un fetch
 *     desde el navegador del cliente sería bloqueado.
 *  2. Caché — Next.js cachea estas respuestas (revalidate) y normalizamos los
 *     datos una sola vez antes de enviarlos al cliente.
 */

const BASE = 'https://cugat.cl/wp-json/wc/store/v1/products'

/** Revalidación del caché de datos de Next (segundos). Precios cambian poco. */
const REVALIDATE_SECONDS = 300

/** Cabeceras de navegador para evitar bloqueos de bots en Cloudflare. */
const UPSTREAM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; CugatConsultaPrecio/1.0; +https://cugat.cl)',
}

async function fetchProducts(
  params: Record<string, string>,
): Promise<CugatProduct[]> {
  const url = new URL(BASE)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, {
    headers: UPSTREAM_HEADERS,
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error(`Cugat API ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as unknown
  return Array.isArray(data) ? (data as CugatProduct[]) : []
}

/**
 * Busca un producto por código de barras (EAN). En Cugat el SKU ES el código,
 * así que la consulta exacta `?sku=` es la vía rápida. Si no aparece (algunos
 * productos podrían tener el código solo en el nombre/atributos) se reintenta
 * con `?search=` y se selecciona la coincidencia exacta de SKU.
 */
export async function lookupByCode(rawCode: string): Promise<Product | null> {
  const code = normalizeCode(rawCode)
  if (!code) return null

  // 1) Coincidencia exacta por SKU.
  const exact = await fetchProducts({ sku: code, per_page: '1' })
  if (exact.length > 0) return normalizeProduct(exact[0])

  // 2) Fallback: búsqueda libre y filtro por SKU exacto.
  const found = await fetchProducts({ search: code, per_page: '10' })
  const match = found.find((p) => normalizeCode(p.sku) === code) ?? found[0]
  return match ? normalizeProduct(match) : null
}

/**
 * Búsqueda por nombre para el modo manual. Devuelve hasta `limit` productos
 * normalizados ordenados por relevancia del motor de WooCommerce.
 */
export async function searchByName(
  query: string,
  limit = 12,
): Promise<Product[]> {
  const q = query.trim()
  if (q.length < 2) return []

  // La Store API ya ordena por relevancia cuando hay `search`; no se pasa
  // `orderby` porque 'relevance' no es un valor válido y devuelve HTTP 400.
  const found = await fetchProducts({
    search: q,
    per_page: String(Math.min(Math.max(limit, 1), 50)),
  })
  return found.map(normalizeProduct)
}

export const cugatConfig = { BASE, REVALIDATE_SECONDS }
