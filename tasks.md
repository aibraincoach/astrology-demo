# Astrology App — Task Tracker

## Milestone 1: Project Setup
- [x] Create GitHub repo — 2026-05-13
- [x] Initialize project folder with framework files (PRD, claude.md, planning.md, tasks.md) — 2026-05-13
- [x] Create .gitignore (node_modules, .env.local) — 2026-05-13
- [ ] Connect repo to Vercel
- [ ] Add environment variable placeholders in Vercel dashboard
- [ ] Create .env.local locally with API keys

## Milestone 2: Verify Critical Dependency
- [x] Install swisseph via npm in api/ context — 2026-05-13
- [x] Write minimal test function that imports swisseph and calculates one solar longitude — 2026-05-13 (verified: Apr 20 1990 → 30.14° = Taurus ✓)
- [ ] Deploy to Vercel and confirm native addon compiles and runs
- [ ] If swisseph fails: evaluate astronomia as fallback and update planning.md

## Milestone 3: Geocoding and Timezone
- [ ] Sign up for OpenCage API, get key
- [ ] Sign up for timezonedb API, get key
- [ ] Implement geocodeLocation(locationString) → { lat, lng }
- [ ] Implement resolveTimezone(lat, lng, unixtimestamp) → utcOffsetSeconds
- [ ] Test with known cities and verify output

## Milestone 4: Ephemeris Calculation
- [ ] Implement birthDatetimeToJulianDay(date, time, utcOffset) → JD
- [ ] Implement getSunSign(JD) → sign string
- [ ] Implement getMoonSign(JD) → sign string
- [ ] Implement getRising(JD, lat, lng) → sign string using Placidus house system
- [ ] Validate all three against a known reference chart (use astro.com to cross-check)

## Milestone 5: AI Synthesis
- [ ] Implement callOpenAI(sun, moon, rising) → analysis string
- [ ] Write synthesis prompt: three signs in, one cohesive personality analysis out
- [ ] Test output quality — should feel synthesized, not three paragraphs stitched together
- [ ] Cap tokens at 600, temperature 0.7

## Milestone 6: Serverless Function
- [ ] Wire all steps into api/chart.js: geocode → timezone → ephemeris → AI
- [ ] Validate inputs, return clean error messages for missing fields
- [ ] Test end-to-end with Postman or curl before touching the frontend

## Milestone 7: Frontend
- [ ] Build index.html with form: name, birth date, birth time, birth location
- [ ] Add loading state (spinner or progress message while awaiting result)
- [ ] Build result view: Sun / Moon / Rising displayed prominently, analysis below
- [ ] Make it responsive (mobile-first)
- [ ] Style it — clean, readable, not ugly

## Milestone 8: QA and Deploy
- [ ] Test on iPhone Safari
- [ ] Test on Chrome desktop
- [ ] Verify rising sign accuracy against astro.com for 3-4 known charts
- [ ] Push to GitHub, confirm Vercel auto-deploys
- [ ] Smoke test the live URL
