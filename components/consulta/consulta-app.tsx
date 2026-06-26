'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'

import type { Product } from '@/lib/consulta/types'
import { normalizeCode } from '@/lib/consulta/format'
import { useFavorites } from '@/hooks/consulta/use-favorites'
import { useFeedback } from '@/hooks/consulta/use-feedback'
import { useHistory } from '@/hooks/consulta/use-history'
import { useOnlineStatus } from '@/hooks/consulta/use-online-status'
import { TopBar } from './top-bar'
import { HomeView } from './home-view'
import { ScannerView } from './scanner-view'
import { ManualSearch } from './manual-search'
import { ResultOverlay } from './result-overlay'
import { SavedPanel } from './saved-panel'

type View = 'home' | 'scanner' | 'manual'

/** Shell principal del Consulta Precio: orquesta vistas, escaneo y resultado. */
export function ConsultaApp() {
  const [view, setView] = useState<View>('home')
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedTab, setSavedTab] = useState<'history' | 'favorites'>('history')

  const online = useOnlineStatus()
  const history = useHistory()
  const favorites = useFavorites()
  const feedback = useFeedback()

  const handleCode = useCallback((raw: string) => {
    const code = normalizeCode(raw)
    if (!code) return
    setActiveCode(code)
  }, [])

  // Deep-link: /consulta?code=7801234567890 abre el producto directo
  // (útil para códigos QR en góndola o enlaces compartibles).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) handleCode(code)
  }, [handleCode])

  const handleResolved = useCallback(
    (product: Product) => {
      feedback.confirm()
      history.add(product)
    },
    [feedback, history],
  )

  const scanAgain = useCallback(() => {
    setActiveCode(null)
    setView('scanner')
  }, [])

  const closeResult = useCallback(() => {
    setActiveCode(null)
    setView('home')
  }, [])

  const openSaved = useCallback((tab: 'history' | 'favorites' = 'history') => {
    setSavedTab(tab)
    setSavedOpen(true)
  }, [])

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      <TopBar onOpenSaved={() => openSaved('history')} />

      <main className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <HomeView
              key="home"
              recent={history.history}
              onScan={() => setView('scanner')}
              onManual={() => setView('manual')}
              onSelect={handleCode}
            />
          )}

          {view === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 flex-col gap-4 px-5 py-4"
            >
              <button
                type="button"
                onClick={() => setView('home')}
                className="flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Volver
              </button>
              <ManualSearch onSelectCode={handleCode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Escáner a pantalla completa (cámara en pausa mientras hay resultado) */}
      <AnimatePresence>
        {view === 'scanner' && (
          <motion.div
            key="scanner"
            className="fixed inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScannerView
              active={view === 'scanner' && !activeCode}
              onDetected={handleCode}
              onManual={() => {
                setView('manual')
              }}
            />
            <button
              type="button"
              onClick={() => setView('home')}
              aria-label="Volver"
              className="absolute left-5 top-[calc(env(safe-area-inset-top)+1.25rem)] flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
            >
              <ChevronLeft className="size-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado de la consulta */}
      <AnimatePresence>
        {activeCode && (
          <ResultOverlay
            key={activeCode}
            code={activeCode}
            online={online}
            isFavorite={favorites.isFavorite}
            onToggleFavorite={favorites.toggle}
            onResolved={handleResolved}
            onScanAgain={scanAgain}
            onClose={closeResult}
          />
        )}
      </AnimatePresence>

      <SavedPanel
        open={savedOpen}
        initialTab={savedTab}
        history={history.history}
        favorites={favorites.favorites}
        onClose={() => setSavedOpen(false)}
        onSelect={handleCode}
        onRemoveHistory={history.remove}
        onClearHistory={history.clear}
        onRemoveFavorite={favorites.remove}
      />
    </div>
  )
}
