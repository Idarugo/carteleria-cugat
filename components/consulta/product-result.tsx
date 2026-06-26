'use client'

import { motion } from 'motion/react'
import {
  Barcode,
  Flame,
  Heart,
  PackageCheck,
  PackageX,
  TrendingDown,
} from 'lucide-react'

import type { Product } from '@/lib/consulta/types'
import { formatCLP } from '@/lib/consulta/format'
import { cn } from '@/lib/utils'
import { AnimatedPrice } from './animated-price'
import { ProductImage } from './product-image'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}
const item = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function ProductResult({
  product,
  isFavorite,
  onToggleFavorite,
}: {
  product: Product
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const { onSale } = product

  return (
    <motion.article
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-md flex-col gap-5"
    >
      {/* Banda de oferta */}
      {onSale && (
        <motion.div
          variants={item}
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 text-white shadow-lg shadow-red-500/30"
        >
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <Flame className="size-6" fill="currentColor" />
            OFERTA
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-base font-black tabular-nums backdrop-blur">
            -{product.discountPercent}%
          </span>
        </motion.div>
      )}

      {/* Imagen */}
      <motion.div variants={item}>
        <ProductImage src={product.image} alt={product.imageAlt} />
      </motion.div>

      {/* Identidad */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {product.brand && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {product.brand}
            </span>
          )}
          {product.category && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {product.category}
            </span>
          )}
        </div>
        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <p className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
          <Barcode className="size-4" />
          {product.code || 'sin código'}
        </p>
      </motion.div>

      {/* Precio */}
      <motion.div
        variants={item}
        className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur"
      >
        {onSale ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-medium text-muted-foreground line-through decoration-2">
                {formatCLP(product.regularPrice)}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
                <TrendingDown className="size-4" />
                Ahorras {formatCLP(product.savings)}
              </span>
            </div>
            <AnimatedPrice
              value={product.price}
              className="text-5xl font-black leading-none tracking-tight text-red-600 sm:text-6xl dark:text-red-400"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Precio
            </span>
            <AnimatedPrice
              value={product.price}
              className="text-5xl font-black leading-none tracking-tight sm:text-6xl"
            />
          </div>
        )}
      </motion.div>

      {/* Stock + favorito */}
      <motion.div variants={item} className="flex items-center gap-3">
        <StockBadge product={product} />
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
          }
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-colors',
            isFavorite
              ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          <Heart
            className="size-6"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </motion.div>
    </motion.article>
  )
}

function StockBadge({ product }: { product: Product }) {
  if (!product.inStock) {
    return (
      <span className="flex flex-1 items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
        <PackageX className="size-5" />
        Agotado
      </span>
    )
  }
  const low = product.lowStock != null && product.lowStock <= 5
  return (
    <span
      className={cn(
        'flex flex-1 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
        low
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      )}
    >
      <PackageCheck className="size-5" />
      {low ? `Últimas ${product.lowStock} unidades` : 'Disponible'}
    </span>
  )
}
