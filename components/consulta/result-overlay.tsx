'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { ScanLine, X } from 'lucide-react'

import type { Product } from '@/lib/consulta/types'
import { ProductNotFoundError } from '@/lib/consulta/client'
import { isLikelyBarcode } from '@/lib/consulta/format'
import { useProduct } from '@/hooks/consulta/use-product'
import { ProductResult } from './product-result'
import {
  ErrorState,
  InvalidCodeState,
  NotFoundState,
  OfflineState,
  ResultSkeleton,
} from './result-states'

/**
 * Overlay a pantalla completa que ejecuta la consulta del `code` y muestra el
 * estado correspondiente (carga, resultado, no encontrado, error, offline).
 * Notifica al padre cada vez que resuelve un producto nuevo (historial + beep).
 */
export function ResultOverlay({
  code,
  online,
  isFavorite,
  onToggleFavorite,
  onResolved,
  onScanAgain,
  onClose,
}: {
  code: string
  online: boolean
  isFavorite: (code: string) => boolean
  onToggleFavorite: (product: Product) => void
  onResolved: (product: Product) => void
  onScanAgain: () => void
  onClose: () => void
}) {
  const valid = isLikelyBarcode(code)
  const query = useProduct(valid ? code : null)
  const resolvedRef = useRef<string | null>(null)

  useEffect(() => {
    if (query.data && resolvedRef.current !== query.data.code) {
      resolvedRef.current = query.data.code
      onResolved(query.data)
    }
  }, [query.data, onResolved])

  let content: React.ReactNode
  if (!valid) {
    content = <InvalidCodeState onScanAgain={onScanAgain} />
  } else if (!online && !query.data) {
    content = <OfflineState />
  } else if (query.data) {
    content = (
      <ProductResult
        product={query.data}
        isFavorite={isFavorite(query.data.code)}
        onToggleFavorite={() => onToggleFavorite(query.data!)}
      />
    )
  } else if (query.error instanceof ProductNotFoundError) {
    content = <NotFoundState code={code} onScanAgain={onScanAgain} />
  } else if (query.error) {
    content = <ErrorState onRetry={() => query.refetch()} />
  } else {
    content = <ResultSkeleton />
  }

  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col bg-background"
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onScanAgain}
          className="flex h-11 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold transition hover:bg-muted/70"
        >
          <ScanLine className="size-5" />
          Escanear otro
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-2">
        {content}
      </div>
    </motion.div>
  )
}
