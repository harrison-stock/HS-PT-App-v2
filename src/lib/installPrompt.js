// "Add to home screen" / install-as-app helpers.
// Captures the Chromium beforeinstallprompt event so we can trigger a native
// install, and exposes platform/standalone detection for manual instructions.

let deferred = null;
const subs = new Set();
const notify = () => subs.forEach(fn => { try { fn(); } catch (e) {} });

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
}

export function subscribeInstall(fn) { subs.add(fn); return () => subs.delete(fn); }
export function canInstall() { return !!deferred; }

export async function promptInstall() {
  if (!deferred) return 'unavailable';
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  if (outcome === 'accepted') { deferred = null; notify(); }
  return outcome; // 'accepted' | 'dismissed'
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function getPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}
