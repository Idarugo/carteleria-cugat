import { NextResponse } from 'next/server'

import { lookupByCode, searchByName } from '@/lib/consulta/cugat-api'
import type { LookupResponse } from '@/lib/consulta/types'

/**
 * Proxy + caché de la API de Cugat.
 *
 *   GET /api/cugat?code=7801234567890   → { product }     (consulta por EAN)
 *   GET /api/cugat?q=leche              → { results: [] } (búsqueda por nombre)
 *
 * Resuelve CORS, oculta el upstream y entrega datos ya normalizados.
 */

// El handler es dinámico (lee searchParams); el caché real lo provee el
// `revalidate: 300` del fetch upstream (cugat-api.ts) + estas cabeceras CDN.
const CACHE_HEADERS = {
  // CDN/navegador: sirve cacheado y revalida en segundo plano.
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim()
  const query = searchParams.get('q')?.trim()

  try {
    if (query) {
      const results = await searchByName(query)
      return NextResponse.json<LookupResponse>(
        { product: null, results },
        { headers: CACHE_HEADERS },
      )
    }

    if (code) {
      const product = await lookupByCode(code)
      if (!product) {
        return NextResponse.json<LookupResponse>(
          { product: null },
          { status: 404 },
        )
      }
      return NextResponse.json<LookupResponse>(
        { product },
        { headers: CACHE_HEADERS },
      )
    }

    return NextResponse.json(
      { error: 'Falta el parámetro "code" o "q".' },
      { status: 400 },
    )
  } catch (err) {
    console.error('[api/cugat] error:', err)
    return NextResponse.json(
      { error: 'No se pudo consultar el catálogo de Cugat.' },
      { status: 502 },
    )
  }
}
