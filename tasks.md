# Astrology App — Task Tracker

## Milestone 1: Project Setup
- [x] Create GitHub repo — 2026-05-13
- [x] Initialize project folder with framework files (PRD, claude.md, planning.md, tasks.md) — 2026-05-13
- [x] Create .gitignore (node_modules, .env.local) — 2026-05-13
- [x] Connect repo to Vercel — 2026-05-13
- [x] Add environment variables in Vercel dashboard (OPENAI_API_KEY, OPENCAGE_API_KEY, TIMEZONEDB_API_KEY) — 2026-05-13
- [ ] Create .env.local locally with API keys

## Milestone 2: Verify Critical Dependency
- [x] Install swisseph via npm in api/ context — 2026-05-13
- [x] Write minimal test function that imports swisseph and calculates one solar longitude — 2026-05-13 (verified: Apr 20 1990 → 30.14° = Taurus ✓)
- [ ] Deploy to Vercel and confirm native addon compiles and runs (pending this push)
- [ ] If swisseph fails: evaluate astronomia as fallback and update planning.md

## Milestone 3: Geocoding and Timezone
- [x] Sign up for OpenCage API, get key — 2026-05-13 (user provided)
- [x] Sign up for timezonedb API, get key — 2026-05-13 (user provided)
- [x] Implement geocodeLocation(locationString) → { lat, lng } — 2026-05-13
- [x] Implement resolveTimezone(lat, lng, unixtimestamp) → utcOffsetSeconds — 2026-05-13
- [ ] Test with known cities and verify output

## Milestone 4: Ephemeris Calculation
- [x] Implement birthDatetimeToJulianDay(date, time, utcOffset) → JD — 2026-05-13
- [x] Implement getSunSign(JD) → sign string — 2026-05-13
- [x] Implement getMoonSign(JD) → sign string — 2026-05-13
- [x] Implement getRising(JD, lat, lng) → sign string using Placidus house system — 2026-05-13
- [ ] Validate all three against a known reference chart (use astro.com to cross-check)

## Milestone 5: AI Synthesis
- [x] Implement callOpenAI(sun, moon, rising) → analysis string — 2026-05-13
- [x] Write synthesis prompt: three signs in, one cohesive personality analysis out — 2026-05-13
- [ ] Test output quality — should feel synthesized, not three paragraphs stitched together
- [x] Cap tokens at 600, temperature 0.7 — 2026-05-13

## Milestone 6: Serverless Function
- [x] Wire all steps into api/chart.js: geocode → timezone → ephemeris → AI — 2026-05-13
- [x] Validate inputs, return clean error messages for missing fields — 2026-05-13
- [ ] Test end-to-end with Postman or curl before touching the frontend

## Milestone 7: Frontend
- [x] Build index.html with form: name, birth date, birth time, birth location — 2026-05-13
- [x] Add loading state (spinner or progress message while awaiting result) — 2026-05-13
- [x] Build result view: Sun / Moon / Rising displayed prominently, analysis below — 2026-05-13
- [x] Make it responsive (mobile-first) — 2026-05-13
- [x] Style it — clean, readable, not ugly — 2026-05-13

## Milestone 8: QA and Deploy
- [ ] Test on iPhone Safari
- [ ] Test on Chrome desktop
- [ ] Verify rising sign accuracy against astro.com for 3-4 known charts
- [ ] Push to GitHub, confirm Vercel auto-deploys
- [ ] Smoke test the live URL
