# Astrology App — Architecture and Planning

## Vision
A clean, fast, stateless astrology web app. User enters birth data, gets their Big Three (Sun, Moon, Rising) and a synthesized AI personality analysis. No accounts. No database. Done.

## Stack
| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, single file |
| Deployment | Vercel (GitHub CI/CD) |
| Backend | Vercel serverless function (Node.js) |
| Ephemeris | swisseph (npm) |
| Geocoding | OpenCage API (free tier) or Nominatim |
| Timezone | timezonedb API (free tier) |
| AI Synthesis | OpenAI API — gpt-4o-mini |

## Architecture

```
[Browser]
    |
    | POST /api/chart
    | { name, birthDate, birthTime, location }
    v
[Vercel Serverless Function — api/chart.js]
    |
    |-- Geocode location --> lat, lng (OpenCage / Nominatim)
    |-- Resolve timezone --> UTC offset for birth datetime (timezonedb)
    |-- Calculate Julian Day Number
    |-- swisseph: solar longitude --> Sun sign
    |-- swisseph: lunar longitude --> Moon sign
    |-- swisseph: ascendant (Placidus) --> Rising sign
    |-- OpenAI gpt-4o-mini: synthesize three signs --> analysis
    |
    | { sun, moon, rising, analysis }
    v
[Browser renders result]
```

## Key Technical Risks
1. **swisseph native addon on Vercel** — must verify it compiles in Vercel's build environment before building anything else. If it fails, evaluate pure-JS fallback (astronomia).
2. **Timezone resolution** — birth time must be converted to UTC correctly before ephemeris calculation or rising sign will be wrong.
3. **Geocoding accuracy** — user types a city; we need accurate lat/lng. OpenCage is more reliable than Nominatim for ambiguous inputs.

## File Structure
```
/
├── index.html          (entire frontend)
├── api/
│   └── chart.js        (Vercel serverless function)
├── PRD.md
├── claude.md
├── planning.md
├── tasks.md
├── .env.local          (API keys — never committed)
├── .gitignore
└── vercel.json         (if needed for routing config)
```

## Environment Variables Required
- `OPENAI_API_KEY`
- `OPENCAGE_API_KEY` (or equivalent geocoding service)
- `TIMEZONEDB_API_KEY` (or equivalent)
