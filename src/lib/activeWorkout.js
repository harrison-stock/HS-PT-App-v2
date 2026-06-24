// Persists an in-progress workout to localStorage so a crash/close can be
// resumed ("Would you like to continue your workout?"). Keyed per user.
const KEY = (uid) => `hs_active_workout_${uid}`;
const MAX_AGE = 18 * 60 * 60 * 1000; // forget anything older than 18h

export function saveActiveWorkout(userId, data) {
  if (!userId) return;
  try { localStorage.setItem(KEY(userId), JSON.stringify({ ...data, savedAt: Date.now() })); } catch (e) { /* ignore */ }
}

export function loadActiveWorkout(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !d.dayId) return null;
    if (Date.now() - (d.savedAt || 0) > MAX_AGE) { localStorage.removeItem(KEY(userId)); return null; }
    return d;
  } catch (e) { return null; }
}

export function clearActiveWorkout(userId) {
  if (!userId) return;
  try { localStorage.removeItem(KEY(userId)); } catch (e) { /* ignore */ }
}
