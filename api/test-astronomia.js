const { solar, moonposition, sidereal, base, julian } = require('astronomia');

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function signFromLongitude(lon) {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

// Test: 1990-04-20 12:00 UT — Sun should be ~Taurus (30°)
// Known chart: someone born 1988-02-10 07:30 in London
// Sun: Aquarius, Moon: Scorpio, Rising: Capricorn (approx)

const jde = julian.CalendarGregorianToJD(1990, 4, 20 + 12/24);

const sunLon = solar.apparentLongitude(base.J2000Century(jde)) * 180 / Math.PI;
const moonPos = moonposition.position(jde);
const moonLon = moonPos.lon * 180 / Math.PI;

// Ascendant for London (51.5°N, -0.12°E) at this JDE
const gast = sidereal.apparent(jde);
const lngRad = -0.12 * Math.PI / 180;
const lst = gast + lngRad;
const latRad = 51.5 * Math.PI / 180;
const T = base.J2000Century(jde);
const eps = (23.439291111 - 0.013004167 * T) * Math.PI / 180;
const ascRad = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps)));
let ascDeg = ascRad * 180 / Math.PI;
const lstDeg = ((lst * 180 / Math.PI) % 360 + 360) % 360;
if (lstDeg >= 0 && lstDeg < 180) { ascDeg = (ascDeg + 360) % 360; }
else { ascDeg = (ascDeg + 180 + 360) % 360; }

console.log('Sun lon:', sunLon.toFixed(2), '→', signFromLongitude(sunLon));
console.log('Moon lon:', moonLon.toFixed(2), '→', signFromLongitude(moonLon));
console.log('Asc lon:', ascDeg.toFixed(2), '→', signFromLongitude(ascDeg));
