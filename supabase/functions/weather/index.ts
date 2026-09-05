import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return json({ error: 'Not signed in.' }, 401)

    const url = new URL(request.url)
    const latitude = Number(url.searchParams.get('latitude'))
    const longitude = Number(url.searchParams.get('longitude'))
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return json({ error: 'Invalid coordinates.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const token = authorization.replace(/^Bearer\s+/i, '')
    const { error: authError } = await supabase.auth.getUser(token)
    if (authError) return json({ error: 'Session is invalid.' }, 401)

    const cacheKey = `${latitude.toFixed(2)}:${longitude.toFixed(2)}`
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('payload, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (cached) return json(cached.payload)

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
    weatherUrl.searchParams.set('latitude', String(latitude))
    weatherUrl.searchParams.set('longitude', String(longitude))
    weatherUrl.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    )
    weatherUrl.searchParams.set('current', 'temperature_2m,wind_speed_10m')
    weatherUrl.searchParams.set('timezone', 'auto')
    weatherUrl.searchParams.set('forecast_days', '7')

    const response = await fetch(weatherUrl)
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`)
    const payload = await response.json()

    await supabase.from('weather_cache').upsert({
      cache_key: cacheKey,
      payload,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })

    return json(payload)
  } catch (error) {
    console.error(error)
    return json({ error: 'Weather could not be loaded.' }, 502)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=900',
    },
  })
}
