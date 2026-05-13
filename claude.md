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
### Session Summary — [DATE]
**Completed:** [list]
**In Progress:** [list]
**Blockers / Notes:** [anything important]
---
