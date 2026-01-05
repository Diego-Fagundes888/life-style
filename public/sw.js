// Service Worker for Life Sync PWA
// Provides offline caching and background sync

// NOVO: Versionamento dinâmico baseado em data de build
// Incrementar manualmente a cada deploy significativo
const APP_VERSION = '2.1.0';
const BUILD_DATE = '2026-01-03-v2';
const CACHE_NAME = `lifesync-v${APP_VERSION}-${BUILD_DATE}`;

const STATIC_ASSETS = [
    '/',
    '/habits',
    '/goals',
    '/bucket-list',
    '/life-summary',
    '/finances',
    '/review',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - NETWORK-FIRST strategy for fresh content
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);

    // NEVER cache CSS, JS, or _next assets - always fetch fresh
    const isAsset = url.pathname.includes('/_next/') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.includes('.css?') ||
        url.pathname.includes('.js?');

    if (isAsset) {
        // Always go to network for assets, no caching
        event.respondWith(
            fetch(event.request).catch(() => {
                // If offline, try cache as last resort
                return caches.match(event.request);
            })
        );
        return;
    }

    // For navigation and other requests: Network-First with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone and cache successful responses (only for HTML pages)
                if (event.request.mode === 'navigate') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return response;
            })
            .catch(() => {
                // Offline fallback - try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Last resort for navigation
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};

    const options = {
        body: data.body || 'Você tem uma nova notificação',
        icon: '/icon-192.png',
        badge: '/icon-badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now(),
        },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'dismiss', title: 'Dispensar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Life Sync', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Sync any pending offline changes
    console.log('[SW] Syncing offline data...');
    // This would sync with a backend if we had one
}
