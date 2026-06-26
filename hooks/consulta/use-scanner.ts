'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

export type ScannerStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'denied'
  | 'error'
  | 'unsupported'

export type FacingMode = 'environment' | 'user'

interface UseScannerOptions {
  /** Se invoca con cada código nuevo detectado (ya deduplicado). */
  onDetected: (code: string) => void
  /** Controla si el escáner debe estar activo. */
  enabled: boolean
  /** ms para ignorar relecturas del mismo código. */
  dedupeMs?: number
}

/** Formatos típicos de retail: prioriza EAN/UPC, incluye Code128/39. */
const RETAIL_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
]

function buildHints(): Map<DecodeHintType, unknown> {
  const hints = new Map<DecodeHintType, unknown>()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, RETAIL_FORMATS)
  hints.set(DecodeHintType.TRY_HARDER, true)
  return hints
}

/**
 * Lector de códigos de barras sobre <video>. Gestiona permisos, linterna,
 * cambio de cámara frontal/trasera y antirrebote de lecturas duplicadas.
 */
export function useScanner({
  onDetected,
  enabled,
  dedupeMs = 2500,
}: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  const stop = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setTorchOn(false)
    setTorchSupported(false)
  }, [])

  const getTrack = useCallback((): MediaStreamTrack | null => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    return stream?.getVideoTracks()[0] ?? null
  }, [])

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }
    if (!videoRef.current) return

    stop()
    setStatus('starting')

    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader(buildHints(), {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 800,
      })
    }

    try {
      const controls = await readerRef.current.decodeFromConstraints(
        { video: { facingMode: { ideal: facingMode } } },
        videoRef.current,
        (result) => {
          if (!result) return
          const code = result.getText().trim()
          if (!code) return
          const now = Date.now()
          const last = lastScanRef.current
          if (code === last.code && now - last.at < dedupeMs) return
          lastScanRef.current = { code, at: now }
          onDetectedRef.current(code)
        },
      )
      controlsRef.current = controls
      setStatus('scanning')

      // Detección de capacidad de linterna sobre el track activo.
      const track = getTrack()
      const caps = track?.getCapabilities?.() as
        | { torch?: boolean }
        | undefined
      setTorchSupported(Boolean(caps?.torch))
    } catch (err) {
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied')
      } else {
        console.error('[scanner] error:', err)
        setStatus('error')
      }
    }
  }, [facingMode, dedupeMs, stop, getTrack])

  const toggleTorch = useCallback(async () => {
    const track = getTrack()
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints)
      setTorchOn(next)
    } catch (err) {
      console.error('[scanner] torch:', err)
      setTorchSupported(false)
    }
  }, [getTrack, torchOn])

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
  }, [])

  // Arranque/parada según `enabled` y reinicio al cambiar de cámara.
  useEffect(() => {
    if (enabled) {
      void start()
    } else {
      stop()
      setStatus('idle')
    }
    return () => stop()
    // start depende de facingMode, así que cambiar de cámara reinicia el stream.
  }, [enabled, start, stop])

  return {
    videoRef,
    status,
    facingMode,
    torch: { supported: torchSupported, on: torchOn, toggle: toggleTorch },
    switchCamera,
    retry: start,
  }
}
