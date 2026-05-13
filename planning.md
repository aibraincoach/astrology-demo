# Astrology App — Architecture and Planning

> Last updated: 2026-05-13  
> App name: Ephemera

## Vision
A clean, fast, stateless astrology web app. User enters birth data, gets their Big Three (Sun, Moon, Rising) and a synthesized AI personality analysis. No accounts. No database. Done.

---

## Final Confirmed Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS, single file | Zero build steps, zero dependencies, fastest iteration, easiest deployment |
| Deployment | Vercel (GitHub CI/CD) | Native serverless functions, instant preview deploys, free tier generous |
| Backend | Vercel serverless function (Node.js) | One file (`api/chart.js`), one endpoint (`POST /api/chart`), scales to zero |
| Ephemeris | **astronomia** (pure JS) | See decision below. Zero compilation. Verified identical Sun sign output to swisseph. |
| Geocoding | **OpenCage API** (free tier) | More reliable than Nominatim for ambiguous city names. Structured results. 2,500/day free. |
| Timezone | **TimezoneDB API** (free tier) | Resolves UTC offset for any lat/lng + timestamp. Free tier sufficient for launch volume. |
| AI Synthesis | **OpenAI gpt-4o-mini** | Cheapest capable model. Fractions of a cent per reading (~$0.002). Quality is more than sufficient for 4–5 sentence astrological synthesis. |

---

## Why swisseph Was Chosen, Then Abandoned

**Original choice:** `swisseph` wraps the Swiss Ephemeris C library, the gold standard in astronomical calculation. It was specified in PRD.md and `claude.md` rules.

**Failure:** Deployed a minimal test to Vercel. Build failed because `swisseph` requires `node-gyp` to compile a native C addon. Vercel’s build environment runs Node 24 + Python 3.12. Python 3.12 removed `distutils`, which `node-gyp` depends on. The native addon could not compile.

**Resolution:** Switched to `astronomia`, a pure-JavaScript ephemeris library. Verified identical Sun sign output for the same test date (Apr 20 1990 → Taurus). No compilation. No native dependencies. Works everywhere Node.js runs.

See `DECISIONS.md` for exact error logs and the full narrative.

---

## Why AstrologyAPI.com Was Rejected

AstrologyAPI.com (and similar wrappers like AstroSeek API) were considered as a way to outsource all ephemeris + rising sign calculation.

**Rejected because:**
1. **Costs money.** Free tiers are severely limited (often 100 calls/month). At any real volume, the per-call cost exceeds OpenAI + OpenCage + TimezoneDB combined.
2. **Unnecessary wrapper.** We only need three calculations: Sun longitude, Moon longitude, and ascendant. `astronomia` handles all three in pure JS.
3. **Vendor lock-in.** If the API changes pricing or shuts down, the app breaks. Owning the calculation logic is worth the small upfront investment.

---

## Why OpenAI gpt-4o-mini Was Chosen

**Model:** `gpt-4o-mini`

**Reasons:**
- **Cost:** ~$0.002 per reading at 600 tokens output. At 1,000 readings/day, that is $2/day.
- **Capability:** More than sufficient for synthesizing three astrological signs into a cohesive 4–5 sentence paragraph. The task does not require reasoning, coding, or long-context memory.
- **Speed:** Fastest model in OpenAI’s current lineup. Average response time < 2 seconds.
- **Quality ceiling:** `gpt-4o` or `gpt-4` would produce marginally better prose at 10× the cost. The difference is imperceptible for this use case.

---

## Why Supabase Was Deferred

**Deferred to V2.**

V1 is intentionally stateless. There are no user accounts, no saved charts, no history, and no database. Every request is self-contained. This keeps the architecture simple, the codebase small, and the hosting cost zero.

Supabase (or any backend database) will be introduced in V2 if user accounts, saved charts, or sharing permalinks become requirements.

---

## Geocoding Stack

### OpenCage → lat, lng
- **Endpoint:** `https://api.opencagedata.com/geocode/v1/json`
- **Input:** Free-text location string (e.g., "Kyoto, Japan")
- **Output:** `lat`, `lng`, plus structured components (city, country, timezone hint)
- **Why OpenCage:** Handles ambiguous inputs better than Nominatim. Returns confidence scores. More reliable for international city names.

### TimezoneDB → UTC offset
- **Endpoint:** `http://api.timezonedb.com/v2.1/get-time-zone`
- **Input:** `lat`, `lng`, `unixTimestamp`
- **Output:** `gmtOffset` in seconds from UTC
- **Why TimezoneDB:** Accurate historical offsets (handles DST transitions correctly for past dates). Free tier is 1 request/second.

**Critical path:** Birth time must be converted to UT (Universal Time) before Julian Day calculation. If timezone is wrong, Rising sign will be wrong.

---

## postMessage Architecture for Tweaks Panel

The tweaks panel (theme switcher, wheel mode switcher) is not a visible UI element for end-users. It is an **editor-only feature** designed to be activated by an enclosing iframe or preview environment (e.g., a design tool or CMS editor).

### Protocol
```javascript
// Editor → App (activate panel)
window.parent.postMessage({ type: '__activate_edit_mode' }, window.location.origin);

// Editor → App (deactivate panel)
window.parent.postMessage({ type: '__deactivate_edit_mode' }, window.location.origin);

// App → Editor (state changed)
window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme: 'daybreak' } }, window.location.origin);

// App → Editor (panel dismissed)
window.parent.postMessage({ type: '__edit_mode_dismissed' }, window.location.origin);
```

### Why `window.location.origin` instead of a hardcoded domain

- The app may be served from `localhost:3000` (local dev), a Vercel preview URL (`*.vercel.app`), or a custom domain.
- Hardcoding a domain would break the editor integration in at least one of those environments.
- `window.location.origin` dynamically matches the current host, preventing cross-origin leakage while remaining environment-agnostic.
- The `message` event listener validates `ev.origin === window.location.origin`, so malicious third-party iframes cannot trigger the panel.

---

## Architecture Diagram

```
[Browser]
    │
    │ POST /api/chart
    │ { name, birthDate, birthTime, location }
    v
[Vercel Serverless Function — api/chart.js]
    │
    │-- Geocode location --> lat, lng (OpenCage)
    │-- Resolve timezone --> UTC offset seconds (TimezoneDB)
    │-- Convert local time --> UT
    │-- Calculate Julian Day Number
    │-- astronomia: solar longitude --> Sun sign
    │-- astronomia: lunar longitude --> Moon sign
    │-- astronomia: sidereal + ascendant formula --> Rising sign
    │-- OpenAI gpt-4o-mini: synthesize three signs --> analysis
    │
    │ { sun, moon, rising, analysis }
    v
[Browser renders result view]
    ├─ SVG wheel (classic or minimal mode)
    ├─ Three placement cards
    └─ Synthesis paragraph
```

---

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
├── DECISIONS.md
├── HANDOVER.md
├── .env.local          (API keys — never committed)
├── .gitignore
└── package.json        (astronomia only)
```

---

## Environment Variables Required

| Variable | Service | Get it at |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI | platform.openai.com |
| `OPENCAGE_API_KEY` | OpenCage | opencagedata.com |
| `TIMEZONEDB_API_KEY` | TimezoneDB | timezonedb.com |

Add these in `.env.local` for local dev **and** in the Vercel dashboard for production/preview deploys.

---

## Key Technical Risks (Status)

1. **swisseph native addon on Vercel** — ❌ FAILED. Resolved by switching to `astronomia`. Closed.
2. **Timezone resolution** — ✅ Verified. Calgary, Kyoto, and New York test cases all correct.
3. **Geocoding accuracy** — ✅ OpenCage handles ambiguous inputs well. No issues in testing.
4. **Rising sign accuracy** — ✅ Verified against astro.com for Jan 23 1987 9:05 AM Calgary. All three placements correct.
