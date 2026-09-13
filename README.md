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

Requirements:

- Node.js
- npm

Install dependencies:

```bash
npm install