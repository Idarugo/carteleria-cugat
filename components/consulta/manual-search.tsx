'use client'

import { useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { useProductSearch } from '@/hooks/consulta/use-product'
import { isLikelyBarcode, normalizeCode } from '@/lib/consulta/format'
import { ProductRow } from './product-row'

/**
 * Consulta manual: un solo campo que sirve para código de barras (al pulsar
 * Enter o si es numérico) o para búsqueda por nombre en vivo (con debounce).
 */
export function ManualSearch({
  onSelectCode,
}: {
  onSelectCode: (code: string) => void
}) {
  const [value, setValue] = useState('')
  const query = value.trim()
  const numericCode = normalizeCode(query)
  const looksLikeCode = isLikelyBarcode(query) && numericCode === query

  // Solo busca por nombre cuando no parece un código puro.
  const { data: results = [], isFetching } = useProductSearch(
    looksLikeCode ? '' : query,
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (numericCode.length >= 4) onSelectCode(numericCode)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <form onSubmit={submit} className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          inputMode="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Código de barras o nombre del producto"
          className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label="Limpiar"
            className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        )}
      </form>

      {looksLikeCode && (
        <button
          type="button"
          onClick={() => onSelectCode(numericCode)}
          className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Consultar código {numericCode}
        </button>
      )}

      {!looksLikeCode && query.length >= 2 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Resultados</span>
            {isFetching && <Loader2 className="size-4 animate-spin" />}
          </div>
          {results.length === 0 && !isFetching ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Sin coincidencias para “{query}”.
            </p>
          ) : (
            results.map((p) => (
              <ProductRow key={p.id} product={p} onSelect={onSelectCode} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
