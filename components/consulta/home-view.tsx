'use client'

import { motion } from 'motion/react'
import { Keyboard, ScanLine } from 'lucide-react'

import type { StoredProduct } from '@/lib/consulta/types'
import { formatCLP } from '@/lib/consulta/format'

/** Pantalla inicial: invitación a escanear + acceso manual + recientes. */
export function HomeView({
  recent,
  onScan,
  onManual,
  onSelect,
}: {
  recent: StoredProduct[]
  onScan: () => void
  onManual: () => void
  onSelect: (code: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-1 flex-col items-center justify-center gap-8 px-6"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex size-28 items-center justify-center rounded-[2rem] bg-primary/10 text-primary"
        >
          <ScanLine className="size-14" />
          <motion.span
            className="absolute inset-x-5 h-0.5 rounded-full bg-primary"
            animate={{ top: ['22%', '78%', '22%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Escanea un producto
          </h1>
          <p className="text-pretty text-base text-muted-foreground">
            Apunta la cámara al código de barras y consulta su precio al
            instante.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={onScan}
          className="group flex h-16 items-center justify-center gap-3 rounded-3xl bg-primary text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 transition active:scale-[0.98]"
        >
          <ScanLine className="size-7 transition-transform group-hover:scale-110" />
          ESCANEAR
        </button>
        <button
          type="button"
          onClick={onManual}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-muted-foreground transition hover:bg-muted"
        >
          <Keyboard className="size-5" />
          Escribir código o buscar por nombre
        </button>
      </div>

      {recent.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <span className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Consultados recientemente
          </span>
          <div className="flex flex-wrap gap-2">
            {recent.slice(0, 4).map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => onSelect(p.code)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-left transition hover:bg-muted"
              >
                <span className="max-w-[10rem] truncate text-sm font-medium">
                  {p.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-muted-foreground">
                  {formatCLP(p.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
