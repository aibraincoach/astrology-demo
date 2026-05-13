const { solar, moonposition, sidereal, base, julian } = require('astronomia');
const https = require('https');

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function signFromLongitude(lon) {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : require('http');
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

function httpsPost(hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function geocode(location) {
  const key = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${key}&limit=1`;
  const data = await httpsGet(url);
  if (!data.results || data.results.length === 0) throw new Error('Location not found: ' + location);
  const { lat, lng } = data.results[0].geometry;
  return { lat, lng };
}

async function getTimezoneOffset(lat, lng, unixTimestamp) {
  const key = process.env.TIMEZONEDB_API_KEY;
  const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${key}&format=json&by=position&lat=${lat}&lng=${lng}&time=${unixTimestamp}`;
  const data = await httpsGet(url);
  if (data.status !== 'OK') throw new Error('Timezone lookup failed: ' + data.message);
  return data.gmtOffset; // seconds offset from UTC
}

function toJD(year, month, day, hourUT) {
  // Julian Day Number using julian module
  const jde = julian.CalendarGregorianToJD(year, month, day + hourUT / 24);
  return jde;
}

function getSunLongitude(jde) {
  // solar.apparentLongitude returns degrees
  return solar.apparentLongitude(base.J2000Century(jde)) * 180 / Math.PI;
}

function getMoonLongitude(jde) {
  const pos = moonposition.position(jde);
  // pos.lon is in radians
  return pos.lon * 180 / Math.PI;
}

function getAscendant(jde, latDeg, lngDeg) {
  // sidereal.apparent() returns GAST in seconds of time (0–86400)
  const gastSec = sidereal.apparent(jde);
  const gastDeg = gastSec / 3600 * 15; // seconds → degrees (15°/hr)
  // RAMC = LST in degrees (east longitude positive, west negative)
  const RAMC = ((gastDeg + lngDeg) % 360 + 360) % 360;

  const T = base.J2000Century(jde);
  const eps = (23.439291111 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T) * Math.PI / 180;
  const latRad = latDeg * Math.PI / 180;
  const ramcRad = RAMC * Math.PI / 180;

  // Standard ascendant formula: tan(ASC) = -cos(RAMC) / (sin(RAMC)*cos(eps) + tan(lat)*sin(eps))
  const numer = -Math.cos(ramcRad);
  const denom =  Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps);
  let asc = Math.atan(numer / denom) * 180 / Math.PI;
  asc = (asc + 360) % 360;

  // Quadrant correction: ASC must lie within 90° of (RAMC + 90°)
  // i.e. it must be in the eastern rising hemisphere relative to RAMC
  const target = (RAMC + 90) % 360;
  let diff = (asc - target + 360) % 360;
  if (diff > 180) diff -= 360;
  if (Math.abs(diff) > 90) asc = (asc + 180) % 360;

  return asc;
}

async function callOpenAI(sun, moon, rising) {
  const key = process.env.OPENAI_API_KEY;
  const prompt = `You are an expert astrologer writing a personalized personality analysis.
The person has:
- Sun in ${sun}
- Moon in ${moon}
- Rising (Ascendant) in ${rising}

Write a single cohesive personality analysis of 4-5 sentences that synthesizes all three signs together into one unified portrait. Do NOT write three separate paragraphs or list the signs individually. Weave them together into one flowing, insightful description of who this person is — their core identity, emotional world, and how they appear to others. Be specific to the combination, not generic.`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.7,
  };

  const result = await httpsPost('api.openai.com', '/v1/chat/completions', body, { Authorization: `Bearer ${key}` });
  if (result.error) throw new Error('OpenAI error: ' + result.error.message);
  return result.choices[0].message.content.trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, birthDate, birthTime, location } = req.body;

  if (!birthDate || !birthTime || !location) {
    return res.status(400).json({ error: 'birthDate, birthTime, and location are required' });
  }

  try {
    const { lat, lng } = await geocode(location);

    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute] = birthTime.split(':').map(Number);
    const approxUtc = Date.UTC(year, month - 1, day, hour, minute) / 1000;
    const gmtOffsetSeconds = await getTimezoneOffset(lat, lng, approxUtc);

    // Convert local time to UT
    const localDecimalHour = hour + minute / 60;
    let utHour = localDecimalHour - gmtOffsetSeconds / 3600;
    let utDay = day, utMonth = month, utYear = year;
    if (utHour < 0) {
      utHour += 24;
      const d = new Date(Date.UTC(year, month - 1, day - 1));
      utDay = d.getUTCDate(); utMonth = d.getUTCMonth() + 1; utYear = d.getUTCFullYear();
    } else if (utHour >= 24) {
      utHour -= 24;
      const d = new Date(Date.UTC(year, month - 1, day + 1));
      utDay = d.getUTCDate(); utMonth = d.getUTCMonth() + 1; utYear = d.getUTCFullYear();
    }

    const jde = toJD(utYear, utMonth, utDay, utHour);

    const sunLon = getSunLongitude(jde);
    const moonLon = getMoonLongitude(jde);
    const ascLon = getAscendant(jde, lat, lng);

    const sun = signFromLongitude(sunLon);
    const moon = signFromLongitude(moonLon);
    const rising = signFromLongitude(ascLon);

    const analysis = await callOpenAI(sun, moon, rising);

    return res.status(200).json({ sun, moon, rising, analysis, name: name || '' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
