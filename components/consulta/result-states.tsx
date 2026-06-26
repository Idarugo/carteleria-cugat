'use client'

import { motion } from 'motion/react'
import {
  PackageSearch,
  RefreshCw,
  ScanLine,
  ServerCrash,
  WifiOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Skeleton mostrado mientras se consulta el producto. */
export function ResultSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="aspect-square w-full animate-pulse rounded-3xl bg-muted" />
      <div className="flex gap-2">
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-28 w-full animate-pulse rounded-3xl bg-muted" />
    </div>
  )
}

function StateShell({
  icon,
  title,
  description,
  children,
  tone = 'muted',
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
  tone?: 'muted' | 'danger'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-10 text-center"
    >
      <div
        className={
          tone === 'danger'
            ? 'flex size-20 items-center justify-center rounded-3xl bg-destructive/10 text-destructive'
            : 'flex size-20 items-center justify-center rounded-3xl bg-muted text-muted-foreground'
        }
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-pretty text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </motion.div>
  )
}

export function NotFoundState({
  code,
  onScanAgain,
}: {
  code: string
  onScanAgain: () => void
}) {
  return (
    <StateShell
      icon={<PackageSearch className="size-9" />}
      title="Producto no encontrado"
      description={`No encontramos ningún producto con el código ${code} en el catálogo de Cugat.`}
    >
      <Button onClick={onScanAgain} className="h-12 gap-2 px-6 text-base">
        <ScanLine className="size-5" />
        Escanear otro
      </Button>
    </StateShell>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StateShell
      tone="danger"
      icon={<ServerCrash className="size-9" />}
      title="No pudimos consultar"
      description="Hubo un problema al conectar con el catálogo. Revisa tu conexión e inténtalo nuevamente."
    >
      <Button onClick={onRetry} className="h-12 gap-2 px-6 text-base">
        <RefreshCw className="size-5" />
        Reintentar
      </Button>
    </StateShell>
  )
}

export function OfflineState() {
  return (
    <StateShell
      icon={<WifiOff className="size-9" />}
      title="Sin conexión"
      description="No hay internet en este momento. Puedes revisar tu historial y favoritos guardados mientras tanto."
    />
  )
}

export function InvalidCodeState({ onScanAgain }: { onScanAgain: () => void }) {
  return (
    <StateShell
      tone="danger"
      icon={<ScanLine className="size-9" />}
      title="Código inválido"
      description="El código ingresado no tiene un formato válido. Debe contener entre 4 y 14 dígitos."
    >
      <Button onClick={onScanAgain} className="h-12 gap-2 px-6 text-base">
        <ScanLine className="size-5" />
        Intentar de nuevo
      </Button>
    </StateShell>
  )
}
