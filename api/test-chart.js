/* ────────────────────────────────────────────────────────────────────
   Ephemera — chart calculation tests
   Run: npm test  (or: node api/test-chart.js)
   ──────────────────────────────────────────────────────────────────── */

const {
  toJD,
  getSunLongitude,
  getMoonLongitude,
  getAscendant,
  signFromLongitude,
} = require('./chart');

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    console.log(`  ✓ ${label}: ${actual}`);
  } else {
    console.error(`  ✗ ${label}: expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  }
}

function assertClose(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ ${label}: ${actual.toFixed(2)}° (expected ~${expected}°)`);
  } else {
    console.error(`  ✗ ${label}: expected ~${expected}°, got ${actual.toFixed(2)}° (diff ${diff.toFixed(2)}°)`);
    process.exitCode = 1;
  }
}

function testCase(name, fn) {
  console.log(`\n${name}`);
  fn();
}

/* ─── Test 1: Raj's chart — Jan 23 1987, 9:05 AM, Calgary ───
   Cross-checked against astro.com
   Calgary: 51.0447°N, -114.0719°W, UTC-7 in January (MST)           */
testCase("Raj's chart — Jan 23 1987, 9:05 AM, Calgary", () => {
  const gmtOffset = -7;
  const localHour = 9 + 5 / 60;
  const utHour = localHour - gmtOffset; // 16.0833
  const jde = toJD(1987, 1, 23, utHour);

  const sunLon = getSunLongitude(jde);
  const moonLon = getMoonLongitude(jde);
  const ascLon = getAscendant(jde, 51.0447, -114.0719);

  assertClose(sunLon, 302.5, 1.5, 'Sun longitude');       // ~Aquarius 2°
  assertEqual(signFromLongitude(sunLon), 'Aquarius', 'Sun sign');

  assertClose(moonLon, 222, 3, 'Moon longitude');         // ~Scorpio 12°
  assertEqual(signFromLongitude(moonLon), 'Scorpio', 'Moon sign');

  assertClose(ascLon, 317, 3, 'Ascendant longitude');     // ~Aquarius 17°
  assertEqual(signFromLongitude(ascLon), 'Aquarius', 'Rising sign');
});

/* ─── Test 2: 1990-04-20 12:00 UT — Sun at Taurus cusp ───
   Verified: solar longitude ~30.14° = Taurus                      */
testCase('1990-04-20 12:00 UT — Sun sign', () => {
  const jde = toJD(1990, 4, 20, 12);
  const sunLon = getSunLongitude(jde);

  assertClose(sunLon, 30.14, 0.5, 'Sun longitude');
  assertEqual(signFromLongitude(sunLon), 'Taurus', 'Sun sign');
});

/* ─── Test 3: Apollo 11 landing — 1969-07-20 20:17 UTC ───
   Moon in Libra (~187°)                                           */
testCase('Apollo 11 landing — Jul 20 1969, 20:17 UTC', () => {
  const jde = toJD(1969, 7, 20, 20 + 17 / 60);
  const moonLon = getMoonLongitude(jde);

  assertClose(moonLon, 188, 3, 'Moon longitude');         // ~Libra 8°
  assertEqual(signFromLongitude(moonLon), 'Libra', 'Moon sign');
});

/* ─── Test 4: Equinox — 2000-03-20 07:35 UTC ───
   Sun should be ~0° Aries (vernal equinox)                         */
testCase('Vernal equinox 2000 — Mar 20 07:35 UTC', () => {
  const jde = toJD(2000, 3, 20, 7 + 35 / 60);
  const sunLon = getSunLongitude(jde);

  assertClose(sunLon, 0, 1, 'Sun longitude');             // ~0° Aries
  assertEqual(signFromLongitude(sunLon), 'Aries', 'Sun sign');
});

/* ─── Summary ─── */
console.log('\n' + (process.exitCode ? 'Some tests failed.' : 'All tests passed.'));
