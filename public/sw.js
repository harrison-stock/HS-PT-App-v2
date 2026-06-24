// Minimal service worker — present so the app is installable as a PWA.
// Network passthrough (no offline caching); takes control immediately.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* default network handling */ });
