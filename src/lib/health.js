import { supabase } from './supabase'

// Recent daily health metrics (steps / resting HR / weight) for a client.
// Collapses multiple sources per day, preferring non-null values.
export async function loadHealthDaily(userId, days = 30) {
  if (!userId) return [];
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('health_daily')
    .select('day, source, steps, resting_hr, avg_hr, weight_kg')
    .eq('client_id', userId)
    .gte('day', since)
    .order('day', { ascending: true });

  const byDay = {};
  for (const r of (data || [])) {
    const d = (byDay[r.day] = byDay[r.day] || { day: r.day, steps: null, resting_hr: null, avg_hr: null, weight_kg: null });
    for (const k of ['steps', 'resting_hr', 'avg_hr', 'weight_kg']) if (r[k] != null) d[k] = r[k];
  }
  return Object.values(byDay).sort((a, b) => (a.day < b.day ? -1 : 1));
}

export async function loadConnections(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('wearable_connections')
    .select('provider, status, last_sync')
    .eq('client_id', userId)
    .order('provider');
  return data || [];
}

// Asks the edge function for a hosted connect URL and opens it.
export async function startWearableConnect() {
  const { data, error } = await supabase.functions.invoke('health-connect-init', { body: {} });
  if (error || data?.error) return { error: data?.error || error?.message || 'Could not start connection' };
  if (data?.url) { window.location.href = data.url; return {}; }
  return { error: 'No connection URL returned' };
}
