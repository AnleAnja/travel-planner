import { useQuery } from '@tanstack/react-query'
import { CloudSun, Droplets, Wind } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface WeatherCardProps {
  latitude: number
  longitude: number
  destination: string
}

interface Forecast {
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    weather_code: number[]
  }
  current: {
    temperature_2m: number
    wind_speed_10m: number
  }
}

const weatherLabels: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Fog',
  51: 'Light drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Showers',
  95: 'Thunderstorm',
}

async function getForecast(latitude: number, longitude: number) {
  if (supabase) {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    })
    const { data, error } = await supabase.functions.invoke(
      `weather?${query.toString()}`,
      { method: 'GET' },
    )
    if (!error && data) return data as Forecast
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('current', 'temperature_2m,wind_speed_10m')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '7')

  const response = await fetch(url)
  if (!response.ok) throw new Error('Weather could not be loaded.')
  return (await response.json()) as Forecast
}

export function WeatherCard({
  latitude,
  longitude,
  destination,
}: WeatherCardProps) {
  const forecast = useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: () => getForecast(latitude, longitude),
    staleTime: 1000 * 60 * 30,
  })

  if (forecast.isPending) {
    return <div className="weather-card skeleton" aria-label="Loading weather" />
  }

  if (forecast.isError) {
    return (
      <div className="weather-card">
        <CloudSun aria-hidden="true" />
        <div>
          <strong>Weather is unavailable right now</strong>
          <p className="muted">Try again later.</p>
        </div>
      </div>
    )
  }

  const data = forecast.data
  return (
    <section className="weather-card" aria-labelledby="weather-title">
      <div className="weather-current">
        <div className="weather-icon">
          <CloudSun aria-hidden="true" />
        </div>
        <div>
          <span className="eyebrow">{destination}</span>
          <h2 id="weather-title">{Math.round(data.current.temperature_2m)}°</h2>
          <p>{weatherLabels[data.daily.weather_code[0]] ?? 'Mixed'}</p>
        </div>
      </div>
      <div className="weather-detail">
        <span>
          <Droplets size={16} aria-hidden="true" />
          {data.daily.precipitation_probability_max[0]} %
        </span>
        <span>
          <Wind size={16} aria-hidden="true" />
          {Math.round(data.current.wind_speed_10m)} km/h
        </span>
      </div>
      <div className="forecast-row">
        {data.daily.time.slice(1, 5).map((day, index) => (
          <div key={day}>
            <span>
              {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
                new Date(`${day}T12:00:00`),
              )}
            </span>
            <strong>{Math.round(data.daily.temperature_2m_max[index + 1])}°</strong>
            <small>{Math.round(data.daily.temperature_2m_min[index + 1])}°</small>
          </div>
        ))}
      </div>
      <a
        className="weather-source"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
      >
        Weather data: Open-Meteo
      </a>
    </section>
  )
}
