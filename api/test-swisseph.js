const swisseph = require('swisseph');

// Test: calculate solar longitude for a known date
// Using 1990-04-20 12:00 UTC — should be ~29° Aries (Sun in Aries/Taurus cusp)
const julianDay = swisseph.swe_julday(1990, 4, 20, 12.0, swisseph.SE_GREG_CAL);

swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, swisseph.SEFLG_SPEED, (result) => {
  if (result.error) {
    console.error('swisseph error:', result.error);
    process.exit(1);
  }
  const longitude = result.longitude;
  console.log('Julian Day:', julianDay);
  console.log('Solar longitude:', longitude.toFixed(4), 'degrees');

  // Determine sign (each sign = 30 degrees)
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const signIndex = Math.floor(longitude / 30);
  console.log('Sun sign:', signs[signIndex]);
  console.log('swisseph OK');
});
