'use client'

import { ChevronRight, ImageOff, X } from 'lucide-react'

import type { Product } from '@/lib/consulta/types'
import { formatCLP } from '@/lib/consulta/format'
import { cn } from '@/lib/utils'

/** Fila compacta de producto para listas (búsqueda, historial, favoritos). */
export function ProductRow({
  product,
  onSelect,
  onRemove,
}: {
  product: Product
  onSelect: (code: string) => void
  onRemove?: (code: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/50">
      <button
        type="button"
        onClick={() => onSelect(product.code)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.imageAlt}
              className="h-full w-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">
            {product.name}
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {product.code}
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            {product.price <= 0 ? (
              <span className="text-sm font-medium text-muted-foreground">
                Sin precio
              </span>
            ) : (
              <>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    product.onSale && 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatCLP(product.price)}
                </span>
                {product.onSale && (
                  <span className="text-xs font-medium text-muted-foreground line-through">
                    {formatCLP(product.regularPrice)}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </button>

      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(product.code)}
          aria-label="Quitar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      )}
    </div>
  )
}
