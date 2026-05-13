# Ephemera — Developer Handover

> You are holding a stateless astrology web app. A new developer should be productive within 30 minutes of reading this file.

---

## What the App Does

Ephemera calculates a user’s **Big Three** astrology placements — Sun sign, Moon sign, and Rising (Ascendant) sign — from their birth data, then generates a synthesized AI personality analysis.

**Flow:** User enters name (optional), birth date, birth time, and birth city → app geocodes the city, resolves timezone, calculates Julian Day, computes three celestial longitudes → feeds the three signs to OpenAI GPT-4o-mini → returns a unified 4–5 sentence personality portrait.

No accounts. No database. No persistence. Enter → Calculate → Read.

---

## Repository Structure

```
/
├── index.html          # Entire frontend (HTML + CSS + JS, ~1400 lines)
├── api/
│   └── chart.js        # Vercel serverless function — all backend logic
├── PRD.md              # Product requirements
├── planning.md         # Architecture decisions and stack
├── tasks.md            # Task tracker with milestones
├── claude.md           # Session rules for AI agents
├── DECISIONS.md        # Decision log, bugs, fixes, skips
├── HANDOVER.md         # This file
├── package.json        # Only dependency: astronomia
├── .env.local          # API keys — never committed
├── .gitignore
└── vercel.json         # (if needed for routing)
```

**Critical rule:** The frontend is a single HTML file. No build steps. No bundlers. No frameworks.

---

## Full Request Lifecycle

```
[Browser: index.html]
    │
    │ POST /api/chart
    │ { name, birthDate: "YYYY-MM-DD", birthTime: "HH:MM", location: "City, Country" }
    ▼
[api/chart.js — Vercel Serverless Function]
    │
    ├─ 1. Geocode ──► OpenCage API ──► lat, lng
    ├─ 2. Timezone ──► TimezoneDB API ──► UTC offset (seconds)
    ├─ 3. Convert local time → UT (Universal Time)
    ├─ 4. Julian Day Number from UT datetime
    ├─ 5. astronomia.solar.apparentLongitude ──► Sun longitude ──► Sun sign
    ├─ 6. astronomia.moonposition.position ──► Moon longitude ──► Moon sign
    ├─ 7. astronomia.sidereal.apparent + ascendant formula ──► Rising sign
    └─ 8. OpenAI gpt-4o-mini ──► synthesized analysis text
    │
    │ { sun, moon, rising, analysis, name }
    ▼
[Browser renders result view]
    ├─ Result header with name + birth metadata
    ├─ SVG wheel with sign glyphs + planet markers
    ├─ Three placement cards (Sun / Moon / Rising)
    └─ Synthesis paragraph
```

---

## Environment Variables

Create `.env.local` in the project root (never commit it — it is gitignored):

```bash
OPENAI_API_KEY=sk-...
OPENCAGE_API_KEY=...
TIMEZONEDB_API_KEY=...
```

| Variable | Where to get it | Cost |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | ~$0.002 per reading (gpt-4o-mini, 600 tokens) |
| `OPENCAGE_API_KEY` | [opencagedata.com](https://opencagedata.com) | 2,500 requests/day free |
| `TIMEZONEDB_API_KEY` | [timezonedb.com](https://timezonedb.com) | Free tier sufficient |

**Also add these in the Vercel dashboard** (Settings → Environment Variables) so the serverless function can access them at runtime.

---

## How to Run Locally

```bash
# 1. Install the only dependency
npm install

# 2. Create environment file
cp .env.local.example .env.local   # or create manually
# ... edit .env.local with your keys ...

# 3. Start Vercel dev server (requires Vercel CLI)
vercel dev

# 4. Open http://localhost:3000
```

If you do not have the Vercel CLI, install it: `npm i -g vercel`

**Testing the serverless function in isolation:**
```bash
curl -X POST http://localhost:3000/api/chart \
  -H "Content-Type: application/json" \
  -d '{"birthDate":"1987-01-23","birthTime":"09:05","location":"Calgary, Canada"}'
```

---

## How to Deploy

1. Push any branch to GitHub.
2. Vercel auto-deploys every push.
3. Preview deployments are generated for non-main branches.
4. Production deploys only from `main`.

**No manual build step.** The frontend is static HTML. The serverless function runs as-is.

---

## Ephemeris Calculation: Why astronomia, not swisseph

`swisseph` was the original choice (it wraps the gold-standard Swiss Ephemeris C library). It failed to compile on Vercel because Vercel uses Node 24 + Python 3.12, and `distutils` was removed from Python 3.12. `node-gyp` (required by `swisseph`'s native addon) depends on `distutils`.

`astronomia` is a pure-JavaScript ephemeris library with zero native dependencies. It was verified to produce identical Sun sign output to `swisseph` for test dates. It is the current and permanent choice for V1.

**The calculation lives in `api/chart.js`:**
- `getSunLongitude(jde)` — uses `solar.apparentLongitude()`
- `getMoonLongitude(jde)` — uses `moonposition.position()`
- `getAscendant(jde, lat, lng)` — uses `sidereal.apparent()` for GAST, converts to RAMC, applies standard ascendant formula with quadrant correction

See `DECISIONS.md` for the full narrative of the rising sign bug and fix.

---

## PR Workflow

1. Create a feature branch: `git checkout -b feat/description`
2. Make changes.
3. Commit: `git commit -m "type: description"`
4. Push: `git push -u origin feat/description`
5. Create PR via GitHub CLI: `gh pr create --title "..." --body "..."`
6. Request review (or self-review).
7. Merge to `main` after approval.
8. Vercel auto-deploys `main` to production.

**Do not push directly to `main`.** Always use a PR.

---

## What Is Deliberately Out of Scope for V1

| Feature | Reason | Likely V2? |
|---|---|---|
| User accounts / auth | Stateless by design | Maybe (Supabase Auth) |
| Saved charts / history | No database | Yes (Supabase Postgres) |
| Chart sharing / permalinks | Privacy + no DB | Yes (short hash URLs) |
| PNG export of wheel | Requires canvas rasterization lib | Yes (html2canvas or server-side) |
| Full natal chart (all planets) | Scope creep | Maybe |
| Compatibility / synastry | Scope creep | Unlikely |
| Transits / progressions | Scope creep | Unlikely |
| i18n | English-only MVP | Maybe |
| Server-side caching | Low volume, low cost | Yes (Redis) |

---

## What V2 Looks Like

- **Database:** Supabase PostgreSQL for saved charts, user accounts (optional), and chart history.
- **Sharing:** Permalink generation using a short hash of birth data (or stored chart ID).
- **Export:** PNG/SVG export of the full wheel + summary, possibly via a serverless Puppeteer route.
- **Caching:** Redis or Supabase edge functions to cache geocode + ephemeris results (deterministic per birth data, expensive to compute).
- **Mobile app:** Wrap the single HTML file in a Capacitor or WebView shell.
- **More placements:** Mercury, Venus, Mars, Jupiter, Saturn — full natal chart interpretation.

---

## Quick Reference

### Known good test case
```json
{
  "birthDate": "1987-01-23",
  "birthTime": "09:05",
  "location": "Calgary, Canada"
}
```
Expected: Sun = Aquarius, Moon = Scorpio, Rising = Aquarius.

### File to change for styling
Everything is in `index.html` lines 10–711. There is no external CSS.

### File to change for calculation logic
`api/chart.js` lines 61–104.

### File to change for AI prompt
`api/chart.js` lines 106–126.

### Where the wheel is drawn
`index.html` lines 1017–1134 (`drawWheel` function).

---

## Need Help?

1. Read `DECISIONS.md` for why anything is the way it is.
2. Read `PRD.md` for what the product is supposed to do.
3. Read `planning.md` for architecture context.
4. Check `tasks.md` to see what is done and what is next.

Welcome to the project.
