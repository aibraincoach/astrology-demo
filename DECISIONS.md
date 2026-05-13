# Ephemera — Decision Log

> Every decision, every bug, every fix, every deliberate skip.  
> Last updated: 2026-05-13

---

## 1. The swisseph Failure

**Decision:** Use `astronomia` instead of `swisseph` for ephemeris calculation.

### What happened
`swisseph` was the first choice per PRD.md and `claude.md` rules. A minimal test function was written locally (`api/test-swisseph.js`) and verified that Apr 20 1990 → solar longitude 30.14° (Taurus). The file was deployed to Vercel.

### Exact error
Vercel build failed with `node-gyp` compilation errors. The root cause: Vercel’s build environment runs Node 24 + Python 3.12. `distutils` was removed from Python 3.12, and `node-gyp` (which `swisseph` relies on for its native C addon) depends on `distutils`. The native addon could not compile.

### Exact resolution
Switched to `astronomia` (pure JavaScript, zero native dependencies). Verified identical Sun sign output between `swisseph` and `astronomia` for the same test date. Removed `swisseph` from `package.json`, added `astronomia`.

**Lesson:** Test highest-risk dependencies on the target deployment environment before building anything else. This was actually done correctly — the test was deployed early and caught the issue before it blocked the full build.

---

## 2. The Rising Sign Bug

**Decision:** Fix ascendant calculation using proper RAMC conversion and standard ascendant formula.

### What happened
After switching to `astronomia`, the rising sign was wildly incorrect. For a known reference chart (Jan 23 1987, 9:05 AM, Calgary), astro.com reports Rising = Aquarius. Our first implementation returned something completely different.

### Root cause — two compounding errors

**Error 1: Wrong unit.** `sidereal.apparent(jde)` returns **seconds of time** (0–86400), not radians or degrees. The first pass fed raw seconds into trigonometric functions (`Math.sin()`, `Math.cos()`), producing garbage angles.

**Error 2: Wrong quadrant logic.** After converting to degrees, the quadrant correction that decides whether to add 180° was implemented incorrectly. The ascendant must lie within 90° of `(RAMC + 90°)` — the eastern rising hemisphere. The first implementation’s diff-check was inverted.

### Exact fix
```javascript
// Correct: convert GAST seconds → degrees (15° per hour)
const gastSec = sidereal.apparent(jde);
const gastDeg = gastSec / 3600 * 15;
const RAMC = ((gastDeg + lngDeg) % 360 + 360) % 360;

const T = base.J2000Century(jde);
const eps = (23.439291111 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T) * Math.PI / 180;
const latRad = latDeg * Math.PI / 180;
const ramcRad = RAMC * Math.PI / 180;

// Standard ascendant formula
const numer = -Math.cos(ramcRad);
const denom = Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps);
let asc = Math.atan(numer / denom) * 180 / Math.PI;

// Quadrant correction: ASC must be within 90° of (RAMC + 90°)
const target = (RAMC + 90) % 360;
let diff = (asc - target + 360) % 360;
if (diff > 180) diff -= 360;
if (Math.abs(diff) > 90) asc = (asc + 180) % 360;
```

### Verification
Jan 23 1987, 9:05 AM, Calgary → Sun Aquarius, Moon Scorpio, Rising Aquarius. Matches astro.com exactly.

**Lesson:** Astronomical libraries often return unexpected units. Always check the library’s unit conventions against a known reference before trusting the output.

---

## 3. The Smart Apostrophe Bug

**Decision:** Replace curly apostrophe (`’`) with escaped Unicode or straight quotes in JavaScript strings.

### What happened
The frontend stopped working entirely. The "Cast my chart" button did nothing. No console error was immediately obvious because the script failed during parse, before any code ran.

### Root cause
A literal curly right single quotation mark (`'`, U+2019) was typed directly into a single-quoted JavaScript string:
```javascript
// BROKEN — literal curly quote inside single quotes
analysis: '...fall asleep in baths, and read the unsaid sentence in a friend’s pause...'
```
The parser saw the literal `'` as the closing quote, leaving the rest of the line as invalid syntax. This caused a `SyntaxError` on parse. The entire `<script>` block died, so `submitChart` (and every other function) was never defined.

### Exact fix
Replaced the literal curly quote with its Unicode escape sequence (`\u2019`) inside the same single-quoted string:
```javascript
// FIXED — escape sequence avoids the parser collision
analysis: '...fall asleep in baths, and read the unsaid sentence in a friend\u2019s pause...'
```

**Lesson:** Never use curly quotes inside single-quoted JS strings. Prefer double quotes for user-facing copy, or use template literals.

---

## 4. PR #1 Review Rounds 1–6

PR #1 (`feat/new-design`) was the Ephemera UI redesign. It went through six review rounds before merge.

### Round 1 — Architecture & Structure
- **Issue:** `window.lastChartData` was exposed globally for the tweaks panel to re-draw the wheel.
- **Fix:** Moved `lastChartData` to module scope (`let lastChartData = null;` at line 920). The tweaks panel now accesses it via closure, not via `window`.

### Round 2 — DOM Scraping
- **Issue:** The save function scraped the DOM to extract chart data.
- **Fix:** Replaced DOM scraping with the `lastChartData` module variable. `drawWheel()` and `renderResult()` now share state through the module-scoped variable.

### Round 3 — postMessage Security
- **Issue:** Hardcoded `*` as the `postMessage` target origin in the tweaks panel.
- **Fix:** Changed to `window.location.origin` for both `postMessage` sends and the `message` event origin check. This prevents cross-origin leakage if the page is ever embedded.

### Round 4 — Time Input Layout
- **Issue:** On narrow viewports, the segmented time input (HH : MM AM/PM) was crammed into a single grid column next to the date input. Placeholder text collided with itself.
- **Fix:** Added a mobile breakpoint for `.field-row` to stack date and time vertically below 640px. Reduced font size and padding inside `.seg-input` on small screens.

### Round 5 — Wheel SVG Precision
- **Issue:** Planet markers for Sun, Moon, and Rising overlapped completely when two or more placements shared the same sign.
- **Fix:** Added `angleOffset` fanning logic (line 1089–1093). When multiple planets land in the same sign, they are distributed ±8° along the arc from the sign’s center.

### Round 6 — Typography & Polish
- **Issue:** The `analysis-text` container used `textContent`, stripping any intentional formatting from GPT output.
- **Fix:** Kept `textContent` (deliberate — we do not want HTML injection from the AI), but added `white-space: pre-line` in CSS so that GPT’s natural paragraph breaks render correctly.
- **Skipped:** Adding a "copy to clipboard" button for the analysis. Reason: save button already downloads the wheel SVG; copying text is a browser-native feature (select + Ctrl/Cmd+C). Not worth the UI weight for V1.

---

## 5. Decisions Permanently Closed

### wireAdvance threshold logic
The auto-advance function for segmented inputs moves focus to the next field when `value.length >= 2` or `Number(v) > Math.floor(max / 10)`. This means typing `3` in the hour field jumps to minutes (because 3 > 12/10 = 1). Some users find this aggressive. **Decision:** Keep as-is. It is an acceptable UX trade-off for a segmented form — the alternative (always wait for 2 digits) makes `08` and `12` slower to type. The benefit outweighs the occasional surprise.

### Hour 0 validation
The form enforces `hour >= 1 && hour <= 12`. A 24-hour clock would allow `00`, but the UI presents a 12-hour clock with AM/PM. **Decision:** Keep 1–12. The conversion logic correctly maps `12 AM` → 0 and `12 PM` → 12 in 24-hour time. No change needed.

### Tweaks panel keyboard access
The tweaks panel (theme switcher, wheel mode) is hidden by default and only activated via `postMessage` from an editor/iframe host. **Decision:** Do not add a keyboard shortcut or visible UI trigger for end-users. This is an editor-only feature, not an end-user feature. If it becomes end-user facing in V2, it will get a proper toggle button and full ARIA treatment.

### DOM scraping → module variable
As noted in Round 2, all DOM scraping for chart state was replaced with `lastChartData`. This decision is closed — no future feature should scrape the rendered DOM for data.

### `window.lastChartData` → module scope
As noted in Round 1, the global exposure was removed. Closed.

---

## 6. Friction Log

### What took longer than it should have

**Six review rounds for PR #1.** Each round addressed one or two issues. This could have been a single review if all findings were batched upfront. The reason it wasn’t: the reviewer (user) inspected the deployed preview iteratively, raising new issues as they noticed them rather than doing one comprehensive pass. **Lesson for future:** Ask for a comprehensive review checklist before the first round, or do a self-review against a rubric.

**The swisseph discovery.** This actually went well — it was tested on Vercel immediately after installation, and the failure was caught before any other code was written. The friction was not the discovery; it was the time spent writing the fallback `astronomia` implementation and re-verifying accuracy. Total time lost: ~45 minutes.

**The rising sign accuracy required a second fix pass.** After the `astronomia` switch, Sun and Moon were correct on first try. Rising was not. The first fix attempt used the wrong unit for `sidereal.apparent()`. The second attempt used the correct unit but wrong quadrant logic. The third attempt got both right. Total time lost: ~60 minutes. **Lesson:** When fixing a calculation bug, verify against a known reference after *every* change, not just at the end.

---

## 7. Deliberate Skips (Not Bugs)

| Skip | Reason |
|---|---|
| No birth chart wheel save as PNG | SVG download is implemented; PNG rasterization requires `html2canvas` or server-side rendering, both add significant complexity for V1. |
| No chart sharing / permalinks | Requires database or query-string encoding of birth data (privacy concern). Deferred to V2. |
| No user accounts | Stateless by design. V1 is intentionally anonymous. |
| No test suite | Single-file frontend + single serverless function. Manual curl + browser testing is sufficient for V1. Add Jest for V2 if logic grows. |
| No i18n | English-only for V1. All sign names and copy are hardcoded in English. |
| No server-side caching | Each chart request hits OpenCage, TimezoneDB, and OpenAI. Acceptable cost at low volume. Redis cache can be added in V2. |
