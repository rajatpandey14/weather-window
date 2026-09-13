# Weather Window

Weather Window is a React application that turns hourly weather forecast data into a simple outdoor-time recommendation.

Instead of showing only raw forecast values, the app looks across the day's hourly forecast and identifies a short continuous period that is relatively suitable for outdoor activity based on temperature, precipitation probability, and wind speed.

## What the project does

A user enters a city or supported location.

The application:

1. Finds the location using a public geocoding service.
2. Requests the hourly forecast for that location.
3. Examines temperature, precipitation probability, and wind speed.
4. Filters out unsuitable hours.
5. Finds a continuous outdoor window of up to three hours.
6. Displays the recommended window together with the underlying weather values.

The goal is to make information in the raw hourly forecast easier to understand and act on.

## Data sources

This project uses public APIs from Open-Meteo:

- Geocoding API:
  `https://geocoding-api.open-meteo.com/v1/search`
- Forecast API:
  `https://api.open-meteo.com/v1/forecast`

The forecast request uses hourly:

- temperature
- precipitation probability
- wind speed

The application does not create its own weather observations. The recommendation is derived from the forecast data returned by the public API.

## How to run locally

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Then open the local URL shown by Vite in the terminal.

## Production build

To verify the project can be built for production:

```bash
npm run build
```

The production build should complete without errors.

## How to use

1. Enter a city or supported location.
2. Select **Check forecast**.
3. Wait for the forecast to load.
4. Review the recommended outdoor window.
5. Check the precipitation, wind, and temperature values shown with the recommendation.

Examples of supported inputs include:

- Delhi
- New Delhi
- Bengaluru
- Bangalore
- Mumbai
- Chennai
- Jaipur
- Rajasthan
- Madhya Pradesh
- Tamil Nadu
- Telangana

Common alternate city names are normalised before the geocoding request.

For supported Indian state names, the application uses a representative city rather than claiming to provide a forecast for the entire state.

Examples:

- Rajasthan → Jaipur
- Madhya Pradesh → Bhopal
- Tamil Nadu → Chennai
- Telangana → Hyderabad
- Karnataka → Bengaluru

The interface makes this representative-location choice explicit.

## Recommendation logic

The application considers daytime forecast hours between 6:00 AM and 8:00 PM.

An hour is considered suitable when:

- temperature is between 18°C and 32°C
- precipitation probability is 40% or lower
- wind speed is 20 km/h or lower

The application then looks for consecutive suitable hours and recommends a continuous window of up to three hours.

When several windows have the same length, the application uses a simple score based on:

- lower precipitation probability
- lower wind speed
- temperature closer to approximately 24°C

These thresholds are product decisions for this project. They are not a guarantee that conditions will feel comfortable for every person or activity.

## Loading and error handling

The application provides separate states for:

- loading the location and forecast
- a successful result
- a location that cannot be found
- a forecast request that fails
- a location where no suitable outdoor window is available

The application does not invent a recommendation when the available forecast does not meet the current criteria.

For example, a location may return a valid forecast with no suitable outdoor window. This is treated as a valid data outcome rather than an application error.

## What the data supports

The forecast data supports a short-term recommendation based on the returned hourly weather variables.

It supports:

- comparing forecasted conditions across hours
- finding consecutive hours that meet the project's criteria
- summarising the selected window using average values

It does not support:

- a guarantee that outdoor conditions will feel comfortable
- personalised advice for a specific activity
- a full-day or statewide weather assessment
- historical weather analysis
- weather observations independent of the public forecast source

State-level searches are represented by a selected city and should not be interpreted as a forecast for the entire state.

## Responsive design

The interface is designed to work across desktop and narrow mobile layouts.

The layout avoids horizontal overflow and keeps the primary search and result content usable on smaller screens.

The interface is intentionally simple so that the primary action and resulting recommendation remain easy to find.

## Accessibility

The application uses semantic HTML elements including:

- `header`
- `main`
- `section`
- `form`
- `label`
- `button`
- `article`

The form is keyboard accessible and the interface provides clear loading and error messages.

## Technology

- React
- Vite
- JavaScript
- CSS
- Open-Meteo public APIs

## Verification checklist

Before submitting changes, verify the application with:

```bash
npm install
npm run build
npm run dev
```

After the development server starts, verify at least these cases:

- A normal city such as `Bengaluru` returns a forecast window.
- A supported region such as `Rajasthan` shows its representative city.
- A location with no suitable window reports that outcome instead of inventing a recommendation.
- An unknown location shows a clear error message.
- The application remains usable on a narrow screen.

The production build should complete without errors before changes are merged.

## Project limitations

This is a focused demonstration project rather than a complete weather platform.

Current limitations include:

- one-day forecast recommendations
- a fixed set of weather thresholds
- city/location based results
- representative-city handling for supported state names
- no user-specific activity preferences
- no historical or multi-day analysis
- recommendation quality depends on the availability and quality of the public forecast source

These limitations are intentional so the project can clearly demonstrate how raw public data can be transformed into a useful derived insight.

## Design decisions and trade-offs

The project intentionally recommends a short continuous window instead of presenting a large table of hourly values.

This makes the raw dataset easier to understand, but it also means the result is based on predefined assumptions about what counts as suitable outdoor weather.

A three-hour maximum was chosen to keep the recommendation practical and focused.

Representative cities are used for supported state-level searches because the public geocoding and forecast workflow is location-based. The UI communicates this limitation rather than presenting the result as a statewide forecast.

## Fresh-clone verification

To verify the project from a fresh clone:

```bash
git clone <repository-url>
cd weather-window
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Environment variables

This project does not require any environment variables.

The application uses public API endpoints directly from the browser.

## Final verification

Before considering the project ready for review:

1. Confirm the application runs locally.
2. Confirm `npm run build` completes successfully.
3. Test a normal city such as `Bengaluru`.
4. Test a supported region such as `Rajasthan`.
5. Test an unknown location and confirm the error state.
6. Confirm the README instructions work from a fresh clone.
7. Confirm the deployed application is accessible from the live URL.
