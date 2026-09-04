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
      return json({ error: 'Too many attempts. Please try again in a minute.' }, 429)
    }
    attempts.set(forwardedFor, {
      count: rate?.resetAt && rate.resetAt > now ? rate.count + 1 : 1,
      resetAt: rate?.resetAt && rate.resetAt > now ? rate.resetAt : now + 60_000,
    })

    const authorization = request.headers.get('authorization')
    if (!authorization) return json({ error: 'Not signed in.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const token = authorization.replace(/^Bearer\s+/i, '')
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Session is invalid.' }, 401)

    const { code, displayName } = (await request.json()) as {
      code?: string
      displayName?: string
    }
    if (!code?.trim() || !displayName?.trim()) {
      return json({ error: 'Code and display name are required.' }, 400)
    }

    const { data: tripId, error: joinError } = await admin.rpc(
      'join_trip_with_code',
      {
        raw_code: code.trim(),
        member_display_name: displayName.trim(),
        joining_user_id: userData.user.id,
      },
    )

    if (joinError) {
      const message = joinError.message ?? ''
      if (message.includes('Invitation invalid or expired')) {
        return json({ error: 'Invalid or expired invite.' }, 404)
      }
      console.error(joinError)
      return json({ error: 'Could not join the trip.' }, 500)
    }

    return json({ tripId })
  } catch (error) {
    console.error(error)
    return json({ error: 'Could not join the trip.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
