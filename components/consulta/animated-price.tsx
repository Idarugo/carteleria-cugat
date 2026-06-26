'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

import { formatCLP } from '@/lib/consulta/format'
import { cn } from '@/lib/utils'

/**
 * Precio en CLP con animación de conteo al aparecer/cambiar.
 * Respeta `prefers-reduced-motion` saltando directo al valor final.
 */
export function AnimatedPrice({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => formatCLP(v))

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [value, mv])

  return (
    <motion.span className={cn('tabular-nums', className)}>{text}</motion.span>
  )
}
