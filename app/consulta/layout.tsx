import type { Metadata, Viewport } from 'next'

import { ConsultaProviders } from '@/components/consulta/providers'
import { PWARegister } from '@/components/consulta/pwa-register'

export const metadata: Metadata = {
  title: 'Consulta Precio · Cugat',
  description:
    'Escanea el código de barras y consulta el precio de cualquier producto de Cugat al instante.',
  manifest: '/consulta/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Consulta Precio',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

/** Script que aplica el tema guardado antes del primer paint (evita parpadeo). */
const themeScript = `(function(){try{var t=localStorage.getItem('cugat:consulta:theme');var r=document.documentElement;r.classList.remove('dark','light');if(t==='dark')r.classList.add('dark');else if(t==='light')r.classList.add('light');}catch(e){}})();`

export default function ConsultaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConsultaProviders>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
      <PWARegister />
    </ConsultaProviders>
  )
}
