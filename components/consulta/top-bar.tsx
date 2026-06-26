'use client'

import { Moon, Star, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/consulta/use-theme'

/** Cabecera fija: marca, acceso a guardados y conmutador de tema. */
export function TopBar({ onOpenSaved }: { onOpenSaved: () => void }) {
  const { toggle, isDark } = useTheme()

  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <span className="text-lg font-black">C</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight">Cugat</span>
          <span className="text-xs font-medium text-muted-foreground">
            Consulta Precio
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSaved}
          aria-label="Historial y favoritos"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Star className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label="Cambiar tema"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>
    </header>
  )
}
