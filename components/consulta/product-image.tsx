'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ImageOff } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Imagen principal del producto con:
 *  - blur-up al cargar
 *  - parallax sutil siguiendo el puntero/dedo
 *  - fallback elegante cuando el producto no tiene foto
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), {
    stiffness: 150,
    damping: 18,
  })
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), {
    stiffness: 150,
    damping: 18,
  })

  function handleMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function reset() {
    px.set(0)
    py.set(0)
  }

  const showFallback = !src || errored

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn(
        'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-muted/60 to-muted/20',
        className,
      )}
      style={{ perspective: 800 }}
    >
      {showFallback ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <ImageOff className="size-12 opacity-60" />
          <span className="text-sm font-medium">Sin imagen</span>
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <motion.img
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            style={{ rotateX: rx, rotateY: ry }}
            initial={{ opacity: 0, scale: 1.06, filter: 'blur(16px)' }}
            animate={
              loaded
                ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                : { opacity: 0 }
            }
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full select-none object-contain p-6 drop-shadow-2xl"
          />
        </>
      )}
    </div>
  )
}
