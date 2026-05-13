const swisseph = require('swisseph');
const https = require('https');

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function signFromLongitude(lon) {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers } }, (res) => {
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

function toJulianDay(year, month, day, hourDecimalUT) {
  return swisseph.swe_julday(year, month, day, hourDecimalUT, swisseph.SE_GREG_CAL);
}

function calcPlanet(jd, planet) {
  return new Promise((resolve, reject) => {
    swisseph.swe_calc_ut(jd, planet, swisseph.SEFLG_SPEED, (result) => {
      if (result.error) reject(new Error(result.error));
      else resolve(result.longitude);
    });
  });
}

function calcAscendant(jd, lat, lng) {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, lat, lng, 'P', (result) => {
      if (result.error) reject(new Error(result.error));
      else resolve(result.ascendant);
    });
  });
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
    // 1. Geocode
    const { lat, lng } = await geocode(location);

    // 2. Parse birth datetime and get unix timestamp (assume local time, resolve tz)
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute] = birthTime.split(':').map(Number);
    // Approximate unix timestamp using UTC to look up timezone
    const approxUtc = Date.UTC(year, month - 1, day, hour, minute) / 1000;
    const gmtOffsetSeconds = await getTimezoneOffset(lat, lng, approxUtc);

    // 3. Convert local birth time to UTC decimal hour
    const localDecimalHour = hour + minute / 60;
    const utcDecimalHour = localDecimalHour - gmtOffsetSeconds / 3600;

    // Handle day rollover
    let utcDay = day, utcMonth = month, utcYear = year;
    let adjustedHour = utcDecimalHour;
    if (adjustedHour < 0) {
      adjustedHour += 24;
      const d = new Date(Date.UTC(year, month - 1, day - 1));
      utcDay = d.getUTCDate(); utcMonth = d.getUTCMonth() + 1; utcYear = d.getUTCFullYear();
    } else if (adjustedHour >= 24) {
      adjustedHour -= 24;
      const d = new Date(Date.UTC(year, month - 1, day + 1));
      utcDay = d.getUTCDate(); utcMonth = d.getUTCMonth() + 1; utcYear = d.getUTCFullYear();
    }

    // 4. Julian Day
    const jd = toJulianDay(utcYear, utcMonth, utcDay, adjustedHour);

    // 5. Calculate signs
    const [sunLon, moonLon, ascLon] = await Promise.all([
      calcPlanet(jd, swisseph.SE_SUN),
      calcPlanet(jd, swisseph.SE_MOON),
      calcAscendant(jd, lat, lng),
    ]);

    const sun = signFromLongitude(sunLon);
    const moon = signFromLongitude(moonLon);
    const rising = signFromLongitude(ascLon);

    // 6. AI synthesis
    const analysis = await callOpenAI(sun, moon, rising);

    return res.status(200).json({ sun, moon, rising, analysis, name: name || '' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
