import { supabase } from './supabase'

export const SEV_COLOR = { mild: 'var(--c-amber)', moderate: 'var(--c-coral)', severe: '#d93434' };
export const SEV_LABEL = { mild: 'MILD', moderate: 'MODERATE', severe: 'SEVERE' };
export const SEV_VAL   = { mild: 0.35, moderate: 0.65, severe: 1.0 };

export async function loadInjuries(clientId) {
  const { data } = await supabase
    .from('client_injuries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function reportInjury({ clientId, trainerId, group, side, severity, note }) {
  const { data } = await supabase
    .from('client_injuries')
    .insert({
      client_id: clientId, trainer_id: trainerId || null,
      muscle_group: group, body_side: side, severity, note: note || '',
    })
    .select('id').single();
  return data?.id;
}

export async function resolveInjury(id) {
  await supabase.from('client_injuries').update({ resolved_at: new Date().toISOString() }).eq('id', id);
}

export async function reopenInjury(id) {
  await supabase.from('client_injuries').update({ resolved_at: null }).eq('id', id);
}

export async function loadInjuryNotes(injuryId) {
  const { data } = await supabase
    .from('client_injury_notes')
    .select('*')
    .eq('injury_id', injuryId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function addInjuryNote(injuryId, authorId, body) {
  await supabase.from('client_injury_notes').insert({ injury_id: injuryId, author_id: authorId, body });
}
