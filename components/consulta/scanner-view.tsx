'use client'

import { motion } from 'motion/react'
import {
  CameraOff,
  Keyboard,
  RefreshCw,
  SwitchCamera,
  Zap,
  ZapOff,
} from 'lucide-react'

import { useScanner } from '@/hooks/consulta/use-scanner'
import { Button } from '@/components/ui/button'

/**
 * Visor de cámara a pantalla completa con retícula, línea de escaneo animada
 * y controles de linterna / cambio de cámara. Detecta y consulta sin botones.
 */
export function ScannerView({
  active,
  onDetected,
  onManual,
}: {
  active: boolean
  onDetected: (code: string) => void
  onManual: () => void
}) {
  const { videoRef, status, torch, switchCamera, retry } = useScanner({
    onDetected,
    enabled: active,
  })

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />

      {/* Capa de máscara con ventana de escaneo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/45 [mask-image:radial-gradient(ellipse_72%_42%_at_center,transparent_60%,black_72%)]" />
        <ScanReticle scanning={status === 'scanning'} />
      </div>

      {/* Mensajes de estado */}
      {status !== 'scanning' && (
        <StatusOverlay status={status} onRetry={retry} onManual={onManual} />
      )}

      {/* Controles inferiores */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        {torch.supported && (
          <ControlButton
            label={torch.on ? 'Apagar linterna' : 'Encender linterna'}
            onClick={torch.toggle}
            active={torch.on}
          >
            {torch.on ? (
              <Zap className="size-6" fill="currentColor" />
            ) : (
              <ZapOff className="size-6" />
            )}
          </ControlButton>
        )}
        <ControlButton label="Cambiar cámara" onClick={switchCamera}>
          <SwitchCamera className="size-6" />
        </ControlButton>
        <ControlButton label="Escribir código" onClick={onManual}>
          <Keyboard className="size-6" />
        </ControlButton>
      </div>

      {status === 'scanning' && (
        <p className="absolute inset-x-0 top-6 text-center text-sm font-medium text-white/80 drop-shadow">
          Apunta al código de barras
        </p>
      )}
    </div>
  )
}

function ScanReticle({ scanning }: { scanning: boolean }) {
  return (
    <div className="absolute left-1/2 top-1/2 aspect-[5/3] w-[72%] max-w-md -translate-x-1/2 -translate-y-1/2">
      {/* Esquinas */}
      {[
        'left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl',
        'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl',
        'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl',
        'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl',
      ].map((c) => (
        <span
          key={c}
          className={`absolute size-9 border-white/90 ${c}`}
        />
      ))}
      {/* Línea de escaneo */}
      {scanning && (
        <motion.span
          className="absolute inset-x-3 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_12px_2px] shadow-emerald-400/70"
          initial={{ top: '8%' }}
          animate={{ top: ['8%', '92%', '8%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

function StatusOverlay({
  status,
  onRetry,
  onManual,
}: {
  status: ReturnType<typeof useScanner>['status']
  onRetry: () => void
  onManual: () => void
}) {
  if (status === 'starting') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
        <RefreshCw className="size-8 animate-spin" />
        <p className="text-sm font-medium">Iniciando cámara…</p>
      </div>
    )
  }

  const messages: Record<string, { title: string; desc: string }> = {
    denied: {
      title: 'Permiso de cámara denegado',
      desc: 'Habilita el acceso a la cámara en tu navegador o ingresa el código manualmente.',
    },
    error: {
      title: 'No se pudo abrir la cámara',
      desc: 'Inténtalo de nuevo o usa la consulta manual.',
    },
    unsupported: {
      title: 'Cámara no disponible',
      desc: 'Tu dispositivo o navegador no permite escanear. Usa la consulta manual.',
    },
    idle: { title: '', desc: '' },
    scanning: { title: '', desc: '' },
  }
  const m = messages[status] ?? messages.error

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 px-8 text-center text-white">
      <CameraOff className="size-12 opacity-80" />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{m.title}</h3>
        <p className="max-w-xs text-sm text-white/70">{m.desc}</p>
      </div>
      <div className="flex gap-3">
        {status === 'error' && (
          <Button
            onClick={onRetry}
            variant="secondary"
            className="h-11 gap-2 px-5"
          >
            <RefreshCw className="size-5" />
            Reintentar
          </Button>
        )}
        <Button onClick={onManual} className="h-11 gap-2 px-5">
          <Keyboard className="size-5" />
          Ingresar código
        </Button>
      </div>
    </div>
  )
}

function ControlButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        active
          ? 'flex size-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition active:scale-95'
          : 'flex size-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95'
      }
    >
      {children}
    </button>
  )
}
