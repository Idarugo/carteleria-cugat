'use client'

import { useCallback, useRef } from 'react'

/**
 * Feedback de confirmación al detectar un código: vibración + beep.
 * El AudioContext se crea perezosamente (requiere gesto del usuario) y se
 * reutiliza para no agotar contextos en navegadores móviles.
 */
export function useFeedback() {
  const audioRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!audioRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctx) return null
      audioRef.current = new Ctx()
    }
    return audioRef.current
  }, [])

  const beep = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    // Doble tono corto estilo lector de supermercado.
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.setValueAtTime(1320, now + 0.08)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  }, [getAudioContext])

  const vibrate = useCallback((pattern: number | number[] = 60) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        /* noop */
      }
    }
  }, [])

  /** Confirmación combinada al detectar un producto. */
  const confirm = useCallback(() => {
    vibrate(60)
    beep()
  }, [vibrate, beep])

  return { confirm, beep, vibrate }
}
