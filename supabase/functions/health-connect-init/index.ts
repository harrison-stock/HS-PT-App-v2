// health-connect-init — starts a wearable connection for the signed-in client.
// Verifies the user's Supabase JWT, then asks the aggregator (Terra/Vital) for a
// hosted connect/widget URL, passing the user's profile id as the reference so
// the ingest-health webhook can map data back to this client. Returns { url }.
//
// SETUP
//   supabase functions deploy health-connect-init
//   supabase secrets set TERRA_API_KEY=... TERRA_DEV_ID=...   (or Vital equivalents)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.harrisonstock.co.uk'

// Terra creds (swap the block below for Vital if you choose Vital).
const TERRA_API_KEY = Deno.env.get('TERRA_API_KEY') ?? ''
const TERRA_DEV_ID = Deno.env.get('TERRA_DEV_ID') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    // Identify the caller from their Supabase session.
    const authHeader = req.headers.get('Authorization') || ''
    const supa = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return json({ error: 'not authenticated' }, 401)

    if (!TERRA_API_KEY || !TERRA_DEV_ID) {
      return json({ error: 'health provider not configured — set TERRA_API_KEY / TERRA_DEV_ID' }, 503)
    }

    // Ask Terra for a hosted "widget session" the client completes in-browser.
    // reference_id = our profile id → echoed back by the ingest webhook.
    const res = await fetch('https://api.tryterra.co/v2/auth/generateWidgetSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'dev-id': TERRA_DEV_ID, 'x-api-key': TERRA_API_KEY },
      body: JSON.stringify({
        reference_id: user.id,
        providers: 'GARMIN,FITBIT,WITHINGS,OURA,GOOGLE',
        language: 'en',
        auth_success_redirect_url: `${APP_URL}/?health=connected`,
        auth_failure_redirect_url: `${APP_URL}/?health=failed`,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data?.url) return json({ error: data?.message || 'could not start connection' }, 502)
    return json({ url: data.url })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
