/**
 * Service Worker del Consulta Precio.
 *
 * Estrategia:
 *  - Navegaciones: network-first; offline cae al shell cacheado de /consulta.
 *  - Estáticos de Next (/_next/static, hash inmutable): cache-first.
 *  - /api/*: solo red (precios siempre frescos; offline lo cubre el historial).
 *
 * Registrado solo en producción y con scope global para poder cachear los
 * chunks de Next y permitir que /consulta arranque sin conexión.
 */

const CACHE = 'cugat-consulta-v1'
const SHELL = '/consulta'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([SHELL, '/consulta/icon.svg']))
      .catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo GET de mismo origen.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Nunca cachear la API: precios frescos.
  if (url.pathname.startsWith('/api/')) return

  // Navegaciones: network-first con fallback al shell de /consulta.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        url.pathname.startsWith('/consulta')
          ? caches.match(SHELL).then((r) => r || Response.error())
          : Response.error(),
      ),
    )
    return
  }

  // Estáticos inmutables de Next y recursos: cache-first + revalidación.
  const isStatic =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/consulta/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})
