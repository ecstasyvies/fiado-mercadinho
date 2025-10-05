/*
  Service Worker para PWA do Fiados do Mercadinho
  Estratégias:
  - Pré-cache de shell da aplicação
  - Navegação: network-first com fallback offline
  - Estático local: cache-first
  - Recursos externos (fonts): stale-while-revalidate
*/

const SW_VERSION = 'v2';
const STATIC_CACHE = `fiados-static-${SW_VERSION}`;
const RUNTIME_CACHE = `fiados-runtime-${SW_VERSION}`;

// Arquivos essenciais da aplicação (app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/layout.css',
  '/offline.html',
  '/manifest.webmanifest',
  '/lógica/principal.js',
  '/lógica/acessibilidade.js',
  '/lógica/clientes.js',
  '/lógica/configuracoes.js',
  '/lógica/dataset.js',
  '/lógica/interface.js',
  '/lógica/produtos.js',
  '/lógica/relatorio.js',
  '/lógica/seguranca.js',
  // Ícone
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!key.includes(SW_VERSION)) {
            return caches.delete(key);
          }
          return undefined;
        })
      );
      await self.clients.claim();
    })()
  );
});

// Atualização manual: permite que a página peça para ativar a nova versão
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Utilitário simples para detectar navegação
function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navegações: network-first com fallback para offline.html
  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (_) {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match('/offline.html');
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  const url = new URL(request.url);

  // Mesma origem: estáticos
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const destination = request.destination;
        const isAsset = destination === 'script' || destination === 'style';
        const cache = await caches.open(RUNTIME_CACHE);

        if (isAsset) {
          // stale-while-revalidate para JS/CSS (evita ficar preso a versões antigas)
          const cached = await cache.match(request);
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => undefined);
          return cached || fetchPromise || fetch(request);
        } else {
          // Demais estáticos: cache-first
          const cached = await caches.match(request);
          if (cached) return cached;
          try {
            const response = await fetch(request);
            cache.put(request, response.clone());
            return response;
          } catch (_) {
            return caches.match('/offline.html');
          }
        }
      })()
    );
    return;
  }

  // Terceiros (ex.: Google Fonts): stale-while-revalidate
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => undefined);
        return cached || networkPromise || fetch(request);
      })()
    );
  }
});


