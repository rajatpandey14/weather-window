import { useState } from 'react'
import './App.css'

const GEOCODING_API =
  'https://geocoding-api.open-meteo.com/v1/search'

const FORECAST_API =
  'https://api.open-meteo.com/v1/forecast'

const MAX_PRECIPITATION_PROBABILITY = 40
const MAX_WIND_SPEED = 20
const MIN_TEMPERATURE = 18
const MAX_TEMPERATURE = 32

const OUTDOOR_START_HOUR = 6
const OUTDOOR_END_HOUR = 20

const MAX_WINDOW_HOURS = 3

const LOCATION_ALIASES = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  poona: 'Pune',
}

const REGION_ALIASES = {
  rajasthan: 'Jaipur',
  'madhya pradesh': 'Bhopal',
  'tamil nadu': 'Chennai',
  telangana: 'Hyderabad',
  karnataka: 'Bengaluru',
  uttarakhand: 'Dehradun',
  maharashtra: 'Mumbai',
  gujarat: 'Gandhinagar',
  'uttar pradesh': 'Lucknow',
  punjab: 'Chandigarh',
  haryana: 'Chandigarh',
  bihar: 'Patna',
  jharkhand: 'Ranchi',
  odisha: 'Bhubaneswar',
  chhattisgarh: 'Raipur',
  assam: 'Guwahati',
  'west bengal': 'Kolkata',
  kerala: 'Thiruvananthapuram',
  'andhra pradesh': 'Amaravati',
  goa: 'Panaji',
  delhi: 'New Delhi',
}

function normalizeLocationQuery(value) {
  const query = value.trim()
  const normalized = query.toLowerCase()

  if (REGION_ALIASES[normalized]) {
    return {
      query: REGION_ALIASES[normalized],
      region: query,
    }
  }

  if (LOCATION_ALIASES[normalized]) {
    return {
      query: LOCATION_ALIASES[normalized],
      region: null,
    }
  }

  return {
    query,
    region: null,
  }
}

function formatHour(hour) {
  const normalizedHour = hour % 24
  const period = normalizedHour >= 12 ? 'PM' : 'AM'
  const displayHour = normalizedHour % 12 || 12

  return `${displayHour}:00 ${period}`
}

function calculateWindowScore(hours) {
  const averageRain =
    hours.reduce(
      (total, item) => total + item.precipitationProbability,
      0
    ) / hours.length

  const averageWind =
    hours.reduce(
      (total, item) => total + item.windSpeed,
      0
    ) / hours.length

  const averageTemperature =
    hours.reduce(
      (total, item) => total + item.temperature,
      0
    ) / hours.length

  const temperatureDistance =
    Math.abs(averageTemperature - 24)

  const rainPenalty = averageRain * 1.5
  const windPenalty = averageWind * 0.8
  const temperaturePenalty = Math.min(
    temperatureDistance * 2,
    20
  )

  return (
    100 -
    rainPenalty -
    windPenalty -
    temperaturePenalty
  )
}

function findBestWindow(hourly) {
  const daytimeHours = []

  for (let index = 0; index < hourly.time.length; index += 1) {
    const hour = Number(hourly.time[index].slice(11, 13))

    if (
      hour < OUTDOOR_START_HOUR ||
      hour > OUTDOOR_END_HOUR
    ) {
      continue
    }

    daytimeHours.push({
      time: hourly.time[index],
      temperature: hourly.temperature_2m[index],
      precipitationProbability:
        hourly.precipitation_probability[index],
      windSpeed: hourly.wind_speed_10m[index],
    })
  }

  const suitableHours = daytimeHours.filter(
    (hour) =>
      hour.temperature >= MIN_TEMPERATURE &&
      hour.temperature <= MAX_TEMPERATURE &&
      hour.precipitationProbability <=
        MAX_PRECIPITATION_PROBABILITY &&
      hour.windSpeed <= MAX_WIND_SPEED
  )

  if (suitableHours.length === 0) {
    return null
  }

  const windows = []

  for (let index = 0; index < suitableHours.length; index += 1) {
    for (
      let length = 1;
      length <= MAX_WINDOW_HOURS;
      length += 1
    ) {
      const candidate = suitableHours.slice(
        index,
        index + length
      )

      if (candidate.length !== length) {
        continue
      }

      const firstHour = Number(
        candidate[0].time.slice(11, 13)
      )

      const lastHour = Number(
        candidate[candidate.length - 1].time.slice(11, 13)
      )

      if (lastHour - firstHour !== length - 1) {
        continue
      }

      windows.push({
        hours: candidate,
        score: calculateWindowScore(candidate),
      })
    }
  }

  if (windows.length === 0) {
    return null
  }

  /*
    Prefer the longest continuous usable window first.
    Only use score to decide between windows of the same length.
  */
  windows.sort((first, second) => {
    if (second.hours.length !== first.hours.length) {
      return second.hours.length - first.hours.length
    }

    return second.score - first.score
  })

  const bestWindow = windows[0].hours

  const startHour = Number(
    bestWindow[0].time.slice(11, 13)
  )

  const lastHour = Number(
    bestWindow[bestWindow.length - 1].time.slice(11, 13)
  )

  const averageTemperature =
    bestWindow.reduce(
      (total, item) => total + item.temperature,
      0
    ) / bestWindow.length

  const averageRain =
    bestWindow.reduce(
      (total, item) =>
        total + item.precipitationProbability,
      0
    ) / bestWindow.length

  const averageWind =
    bestWindow.reduce(
      (total, item) => total + item.windSpeed,
      0
    ) / bestWindow.length

  return {
    start: formatHour(startHour),
    end: formatHour(lastHour + 1),
    averageTemperature,
    averageRain,
    averageWind,
    hours: bestWindow.length,
  }
}

function App() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedCity = city.trim()

    if (!trimmedCity) {
      setErrorMessage(
        'Enter a city or location before checking the forecast.'
      )
      setResult(null)
      return
    }

    setLoading(true)
    setErrorMessage('')
    setResult(null)

    try {
      const locationInput =
        normalizeLocationQuery(trimmedCity)

      const geocodingResponse = await fetch(
        `${GEOCODING_API}?name=${encodeURIComponent(
          locationInput.query
        )}&count=5&language=en&format=json`
      )

      if (!geocodingResponse.ok) {
        throw new Error(
          'We could not search for that location right now.'
        )
      }

      const geocodingData =
        await geocodingResponse.json()

      if (!geocodingData.results?.length) {
        throw new Error(
          `We could not find a location for "${trimmedCity}". Try a city or well-known place name.`
        )
      }

      const location = geocodingData.results[0]

      const forecastResponse = await fetch(
        `${FORECAST_API}?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=1&timezone=auto`
      )

      if (!forecastResponse.ok) {
        throw new Error(
          'We found the location, but could not load its forecast.'
        )
      }

      const forecastData =
        await forecastResponse.json()

      const bestWindow = findBestWindow(
        forecastData.hourly
      )

      setResult({
        city: location.name,
        country: location.country,
        timezone: location.timezone,
        bestWindow,
        region: locationInput.region,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not load the forecast. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header>
        <h1>Weather Window</h1>

        <p>
          Find a useful outdoor window from the
          forecast.
        </p>
      </header>

      <main>
        <section aria-labelledby="search-title">
          <h2 id="search-title">Choose a location</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="city">
              City or location
            </label>

            <input
              id="city"
              name="city"
              type="text"
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
              placeholder="e.g. Delhi, Bengaluru, Goa"
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Loading forecast...'
                : 'Check forecast'}
            </button>
          </form>
        </section>

        <section aria-labelledby="forecast-title">
          <h2 id="forecast-title">Outdoor window</h2>

          {loading && (
            <p role="status">
              Loading the forecast for{' '}
              {city || 'your location'}...
            </p>
          )}

          {errorMessage && !loading && (
            <p role="alert">{errorMessage}</p>
          )}

          {!loading &&
            !errorMessage &&
            !result && (
              <p>
                Choose a location to see the
                recommended outdoor time.
              </p>
            )}

          {result && !loading && (
            <article>
              <p>
                {result.city}, {result.country}
              </p>

              {result.region && (
                <p>
                  Showing {result.city} as a
                  representative location for{' '}
                  {result.region}.
                </p>
              )}

              {result.bestWindow ? (
                <>
                  <h3>
                    Best outdoor window:{' '}
                    {result.bestWindow.start}–
                    {result.bestWindow.end}
                  </h3>

                  <p>
                    This window has about{' '}
                    {result.bestWindow.averageRain.toFixed(
                      0
                    )}
                    % precipitation probability,{' '}
                    {result.bestWindow.averageWind.toFixed(
                      1
                    )}
                    km/h average wind, and a
                    temperature around{' '}
                    {result.bestWindow.averageTemperature.toFixed(
                      1
                    )}
                    °C.
                  </p>

                  <p>
                    Based on{' '}
                    {result.bestWindow.hours}{' '}
                    consecutive suitable forecast hour
                    {result.bestWindow.hours > 1
                      ? 's'
                      : ''}
                    .
                  </p>
                </>
              ) : (
                <p>
                  No suitable outdoor window was
                  found for today using the current
                  temperature, rain, and wind
                  thresholds.
                </p>
              )}
            </article>
          )}
        </section>
      </main>

      <footer>
        <p>Weather Window</p>
      </footer>
    </>
  )
}

export default App