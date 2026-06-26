'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Clock, Heart, Trash2, X } from 'lucide-react'

import type { StoredProduct } from '@/lib/consulta/types'
import { ProductRow } from './product-row'

type Tab = 'history' | 'favorites'

/** Panel inferior con historial y favoritos guardados (disponible offline). */
export function SavedPanel({
  open,
  initialTab = 'history',
  history,
  favorites,
  onClose,
  onSelect,
  onRemoveHistory,
  onClearHistory,
  onRemoveFavorite,
}: {
  open: boolean
  initialTab?: Tab
  history: StoredProduct[]
  favorites: StoredProduct[]
  onClose: () => void
  onSelect: (code: string) => void
  onRemoveHistory: (code: string) => void
  onClearHistory: () => void
  onRemoveFavorite: (code: string) => void
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const items = tab === 'history' ? history : favorites

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-3xl border-t border-border bg-background shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            <div className="flex items-center justify-between gap-2 p-4">
              <div className="flex gap-1 rounded-full bg-muted p-1">
                <TabButton
                  active={tab === 'history'}
                  onClick={() => setTab('history')}
                  icon={<Clock className="size-4" />}
                  label="Historial"
                />
                <TabButton
                  active={tab === 'favorites'}
                  onClick={() => setTab('favorites')}
                  icon={<Heart className="size-4" />}
                  label="Favoritos"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {items.length === 0 ? (
                <EmptyState tab={tab} />
              ) : (
                <div className="flex flex-col gap-1">
                  {items.map((p) => (
                    <ProductRow
                      key={`${p.code}-${p.viewedAt}`}
                      product={p}
                      onSelect={(code) => {
                        onSelect(code)
                        onClose()
                      }}
                      onRemove={
                        tab === 'history' ? onRemoveHistory : onRemoveFavorite
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {tab === 'history' && history.length > 0 && (
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                  Borrar historial
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'flex items-center gap-1.5 rounded-full bg-background px-4 py-1.5 text-sm font-semibold shadow-sm'
          : 'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground'
      }
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-muted-foreground">
      {tab === 'history' ? (
        <Clock className="size-10 opacity-50" />
      ) : (
        <Heart className="size-10 opacity-50" />
      )}
      <p className="text-sm">
        {tab === 'history'
          ? 'Aún no has consultado productos.'
          : 'No tienes productos favoritos todavía.'}
      </p>
    </div>
  )
}
