import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
}

const attempts = new Map<string, { count: number; resetAt: number }>()

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const forwardedFor = request.headers.get('x-forwarded-for') ?? 'unknown'
    const now = Date.now()
    const rate = attempts.get(forwardedFor)
    if (rate && rate.resetAt > now && rate.count >= 8) {
      return json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' }, 429)
    }
    attempts.set(forwardedFor, {
      count: rate?.resetAt && rate.resetAt > now ? rate.count + 1 : 1,
      resetAt: rate?.resetAt && rate.resetAt > now ? rate.resetAt : now + 60_000,
    })

    const authorization = request.headers.get('authorization')
    if (!authorization) return json({ error: 'Nicht angemeldet.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })

    const token = authorization.replace(/^Bearer\s+/i, '')
    const { data: userData, error: userError } = await userClient.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Sitzung ungültig.' }, 401)

    const { code, displayName } = (await request.json()) as {
      code?: string
      displayName?: string
    }
    if (!code?.trim() || !displayName?.trim()) {
      return json({ error: 'Code und Anzeigename sind erforderlich.' }, 400)
    }

    const { data: tripId, error: joinError } = await userClient.rpc(
      'join_trip_with_code',
      {
        raw_code: code.trim(),
        member_display_name: displayName.trim(),
      },
    )

    if (joinError) {
      const message = joinError.message ?? ''
      if (message.includes('Invitation invalid or expired')) {
        return json({ error: 'Einladung ungültig oder abgelaufen.' }, 404)
      }
      console.error(joinError)
      return json({ error: 'Beitritt fehlgeschlagen.' }, 500)
    }

    return json({ tripId })
  } catch (error) {
    console.error(error)
    return json({ error: 'Beitritt fehlgeschlagen.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
