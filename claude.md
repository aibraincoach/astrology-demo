# Claude Code Rules — Astrology App

## Mandatory Session Start
At the start of every new conversation, you must:
1. Read planning.md to understand the architecture and current state
2. Read tasks.md to see what is done and what is next
3. Do not begin any work until you have done both of the above

## Task Management
- Before starting any work, check tasks.md
- Mark tasks complete immediately when finished, with completion date
- Add newly discovered tasks to tasks.md as they emerge
- Never duplicate a task that already exists

## Code Rules
- Single HTML file for the frontend — no frameworks, no bundlers, no build steps
- Vercel serverless function for all backend logic (api/chart.js)
- All API keys come from environment variables — never hardcode them
- swisseph is the only permitted library for ephemeris calculation — do not substitute another approach without flagging it
- Keep the serverless function under Vercel's execution limits
- Test the swisseph native addon compilation on Vercel early — this is the highest-risk dependency

## Communication Rules
- Flag blockers immediately rather than working around them silently
- If swisseph fails to compile on Vercel, surface this before building anything else
- Do not add features not in PRD.md without asking first

## Session Summary (run before clearing context)
When asked to add a session summary, append a dated entry to the bottom of this file in the format below:

---
### Session Summary — 2026-05-13
**Completed:**
- Initialized four-file framework (PRD.md, claude.md, planning.md, tasks.md)
- Set up GitHub repo and Vercel project with environment variables
- Verified swisseph compilation on Vercel — **FAILED** due to Node 24 + Python 3.12 + missing distutils
- Switched ephemeris library to astronomia (pure JS), verified identical Sun sign output
- Built complete serverless function (`api/chart.js`) with geocoding (OpenCage), timezone resolution (TimezoneDB), Julian Day conversion, Sun/Moon/Rising calculation, and OpenAI synthesis (gpt-4o-mini)
- Built entire frontend in single `index.html`: responsive form with segmented date/time inputs, loading state with poetic messages, result view with three placement cards, SVG wheel chart, synthesis paragraph
- Implemented auto-advance for segmented inputs, demo chart bypass, save-as-SVG, reset flow
- Implemented tweaks panel with postMessage architecture for editor integration (theme: auto/midnight/daybreak/eclipse, wheel: classic/minimal)
- Fixed rising sign bug: corrected `sidereal.apparent()` unit conversion (seconds → degrees) and quadrant logic
- Fixed smart apostrophe syntax error that killed the entire script
- Survived six review rounds for PR #1 (UI redesign), applying fixes for module scope, DOM scraping, postMessage security, mobile layout, wheel overlap, and typography
- Created DECISIONS.md and HANDOVER.md for complete project documentation

**Tools used:** npm, curl, Vercel CLI, GitHub CLI (`gh`), OpenCage API, TimezoneDB API, OpenAI API, astronomia npm package

**Prompt patterns that worked:**
- "Verify against astro.com for [date] [time] [location]" — forcing external reference validation caught the rising sign bug
- "Deploy to Vercel and test" — caught swisseph failure before it became a blocker
- "Show me the exact error, exact cause, exact resolution" — produced precise decision log entries
- "Do not add features not in PRD.md without asking first" — prevented scope creep

**How to resume this project in a new session:**
1. Read `planning.md` for architecture and current stack
2. Read `tasks.md` for done/next
3. Read `DECISIONS.md` for context on every bug and fix
4. Read `HANDOVER.md` if you are new to the codebase
5. Run `vercel dev` to start local dev server
6. Test with `curl` to `/api/chart` before touching frontend

**Blockers / Notes:** None. Project is fully functional and deployed.
---
### Session Summary — [DATE]
**Completed:** [list]
**In Progress:** [list]
**Blockers / Notes:** [anything important]
---
