const version = 'weggefaehrten-v1'
const appCache = `${version}-app`
const weatherCache = `${version}-weather`
const appShell = ['./', './index.html', './pwa-icon.svg', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(appCache).then((cache) => cache.addAll(appShell)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![appCache, weatherCache].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET') return

  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(networkFirst(request, weatherCache))
    return
  }

  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.open(appCache).then((cache) => cache.match('./index.html')),
      ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(appCache).then((cache) => cache.put(request, copy))
        }
        return response
      })
      return cached ?? fresh
    }),
  )
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) ?? Response.error()
  }
}
