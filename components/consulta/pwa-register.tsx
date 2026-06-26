'use client'

import { useEffect } from 'react'

/**
 * Registra el Service Worker del Consulta Precio (solo en producción) para
 * habilitar instalación PWA y arranque offline. En desarrollo no se registra
 * para no interferir con el HMR de Next.
 */
export function PWARegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return
    }
    const register = () => {
      navigator.serviceWorker
        .register('/sw-consulta.js')
        .catch((err) => console.error('[pwa] registro falló:', err))
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
