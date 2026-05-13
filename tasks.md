# Astrology App — Task Tracker

> Last updated: 2026-05-13

---

## Milestone 1: Project Setup
- [x] Create GitHub repo — 2026-05-13
- [x] Initialize project folder with framework files (PRD, claude.md, planning.md, tasks.md) — 2026-05-13
- [x] Create .gitignore (node_modules, .env.local) — 2026-05-13
- [x] Connect repo to Vercel — 2026-05-13
- [x] Add environment variables in Vercel dashboard (OPENAI_API_KEY, OPENCAGE_API_KEY, TIMEZONEDB_API_KEY) — 2026-05-13
- [x] Create .env.local locally with API keys — 2026-05-13

## Milestone 2: Verify Critical Dependency
- [x] Install swisseph via npm in api/ context — 2026-05-13
- [x] Write minimal test function that imports swisseph and calculates one solar longitude — 2026-05-13 (verified: Apr 20 1990 → 30.14° = Taurus ✓)
- [x] Deploy to Vercel and confirm native addon compiles and runs — 2026-05-13 (FAILED: node-gyp/distutils incompatible with Node 24 + Python 3.12 on Vercel)
- [x] If swisseph fails: evaluate astronomia as fallback and update planning.md — 2026-05-13 (switched to astronomia, verified Sun sign matches swisseph output)

## Milestone 3: Geocoding and Timezone
- [x] Sign up for OpenCage API, get key — 2026-05-13 (user provided)
- [x] Sign up for timezonedb API, get key — 2026-05-13 (user provided)
- [x] Implement geocodeLocation(locationString) → { lat, lng } — 2026-05-13
- [x] Implement resolveTimezone(lat, lng, unixtimestamp) → utcOffsetSeconds — 2026-05-13
- [x] Test with known cities and verify output — 2026-05-13 (Calgary, Kyoto, New York all correct)

## Milestone 4: Ephemeris Calculation
- [x] Implement birthDatetimeToJulianDay(date, time, utcOffset) → JD — 2026-05-13
- [x] Implement getSunSign(JD) → sign string — 2026-05-13
- [x] Implement getMoonSign(JD) → sign string — 2026-05-13
- [x] Implement getRising(JD, lat, lng) → sign string using Placidus house system — 2026-05-13
- [x] Validate all three against a known reference chart (use astro.com to cross-check) — 2026-05-13 (Jan 23 1987 9:05 AM Calgary: Sun Aquarius, Moon Scorpio, Rising Aquarius ✓)

## Milestone 5: AI Synthesis
- [x] Implement callOpenAI(sun, moon, rising) → analysis string — 2026-05-13
- [x] Write synthesis prompt: three signs in, one cohesive personality analysis out — 2026-05-13
- [x] Test output quality — should feel synthesized, not three paragraphs stitched together — 2026-05-13 (verified: output flows as single portrait)
- [x] Cap tokens at 600, temperature 0.7 — 2026-05-13

## Milestone 6: Serverless Function
- [x] Wire all steps into api/chart.js: geocode → timezone → ephemeris → AI — 2026-05-13
- [x] Validate inputs, return clean error messages for missing fields — 2026-05-13
- [x] Test end-to-end with curl before touching the frontend — 2026-05-13

## Milestone 7: Frontend
- [x] Build index.html with form: name, birth date, birth time, birth location — 2026-05-13
- [x] Add loading state (spinner or progress message while awaiting result) — 2026-05-13
- [x] Build result view: Sun / Moon / Rising displayed prominently, analysis below — 2026-05-13
- [x] Make it responsive (mobile-first) — 2026-05-13
- [x] Style it — clean, readable, not ugly — 2026-05-13

## Milestone 8: QA and Deploy
- [x] Test on iPhone Safari — 2026-05-13 (via BrowserStack / physical device)
- [x] Test on Chrome desktop — 2026-05-13
- [x] Verify rising sign accuracy against astro.com for 3-4 known charts — 2026-05-13 (1 chart verified deeply; others spot-checked)
- [x] Push to GitHub, confirm Vercel auto-deploys — 2026-05-13
- [x] Smoke test the live URL — 2026-05-13

---

## Milestone 9: UI Redesign — PR #1 (feat/new-design)

**PR:** [#1](https://github.com/aibraincoach/astrology-demo/pull/1) — feat: Ephemera design — new UI with wheel, segmented inputs, themes

### Design Tasks
- [x] Rename app to "Ephemera" — 2026-05-13
- [x] Design starfield background (canvas-painted dots, responsive to theme) — 2026-05-13
- [x] Design nav strip with glyph mark (☉☽↑) and live ephemeris stamp — 2026-05-13
- [x] Design intro section: pretitle, display heading, lede, three pillars — 2026-05-13
- [x] Design form with gold corner accents and segmented inputs — 2026-05-13
- [x] Design loading state: rotating zodiac ring SVG with poetic messages — 2026-05-13
- [x] Design result view: header with name + metadata stamp, SVG wheel, three placement cards, synthesis paragraph, actions footer — 2026-05-13
- [x] Implement three themes: midnight (default), daybreak, eclipse — 2026-05-13
- [x] Implement two wheel modes: classic (full detail) and minimal (clean) — 2026-05-13

### Fix Tasks (Review Rounds)
- [x] **Round 1:** Move `window.lastChartData` to module scope (`let lastChartData`) — 2026-05-13
- [x] **Round 2:** Replace DOM scraping with `lastChartData` module variable for save/export — 2026-05-13
- [x] **Round 3:** Change postMessage target from `*` to `window.location.origin` — 2026-05-13
- [x] **Round 4:** Add mobile breakpoint for `.field-row` (stack date/time below 640px), fix time input collision — 2026-05-13
- [x] **Round 5:** Add `angleOffset` fanning for overlapping planet markers in wheel SVG — 2026-05-13
- [x] **Round 6:** Add `white-space: pre-line` for analysis paragraph rendering; skip copy-to-clipboard button — 2026-05-13

### Deferred from PR #1
- [ ] Copy-to-clipboard for analysis text — reason: browser-native select+copy is sufficient for V1
- [ ] PNG export of wheel — reason: requires html2canvas or server-side rendering; SVG download is implemented
- [ ] Full keyboard shortcut for tweaks panel — reason: editor-only feature, not end-user facing

---

## Backlog / V2 Ideas
- [ ] Supabase integration for saved charts and user accounts
- [ ] Chart sharing via permalink (short hash)
- [ ] PNG export of wheel + summary
- [ ] Full natal chart (Mercury, Venus, Mars, Jupiter, Saturn)
- [ ] Redis caching for geocode + ephemeris results
- [ ] i18n / multi-language support
- [ ] Test suite (Jest) for calculation logic
