# Astrology App — Product Requirements Document

## Overview
A stateless web app that calculates a user's Sun, Moon, and Rising signs from their birth data and generates a synthesized personality analysis using AI. No accounts, no database, no persistence. Enter → Calculate → Read.

## User Stories
- As a user, I want to enter my birth date, birth time, and birth location so the app can calculate my three signs.
- As a user, I want to see my Sun, Moon, and Rising signs displayed clearly.
- As a user, I want to read a synthesized personality analysis that integrates all three signs — not three separate boilerplate descriptions.
- As a user, I want the experience to work on mobile and desktop.

## Technical Requirements

### Frontend
- Single HTML file with embedded CSS and JS
- No build steps, no frameworks, no bundlers
- Responsive layout, mobile-first
- Form inputs: name (text), birth date (date picker), birth time (time picker), birth location (text with geocoding)
- Result view: three signs displayed prominently, analysis rendered below
- Loading state while API calls are in flight

### Backend
- Vercel serverless function (Node.js runtime)
- Single endpoint: POST /api/chart
- Accepts: name, birthDate, birthTime, latitude, longitude, timezone
- Step 1: Calculate Sun, Moon, Rising using swisseph (Swiss Ephemeris npm package)
- Step 2: Pass three signs to OpenAI GPT-4o-mini for personality synthesis
- Returns: { sun, moon, rising, analysis }

### Geocoding
- Birth location must be converted to lat/lng + timezone before ephemeris calculation
- Use a free geocoding API (OpenCage or Nominatim/OpenStreetMap) for lat/lng
- Use a free timezone API (timezonedb or Google Time Zone API) to resolve timezone offset for the birth datetime

### Ephemeris Calculation
- Library: swisseph (npm package wrapping Swiss Ephemeris)
- Must calculate Julian Day Number from birth datetime + timezone
- Sun sign: straightforward from solar longitude
- Moon sign: lunar longitude calculation
- Rising sign (Ascendant): requires Julian Day, latitude, longitude, and house system (Placidus)
- Verify swisseph native addon compiles correctly on Vercel build environment early

### AI Synthesis
- Provider: OpenAI
- Model: gpt-4o-mini
- Prompt: instructs the model to synthesize Sun, Moon, and Rising into a single cohesive personality analysis — not three separate paragraphs
- Max tokens: ~600
- Temperature: 0.7

## Success Metrics
- User can get from blank form to personality analysis in under 10 seconds
- Rising sign calculation is accurate against known reference charts
- App works on iPhone Safari and Chrome desktop

## Out of Scope (V1)
- User accounts
- Saved charts
- Chart sharing / permalinks
- Birth chart wheel visualization
- Compatibility / synastry
- Transits or progressions
