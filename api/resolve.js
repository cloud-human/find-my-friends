export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const finalUrl = response.url;

    const coords = extractCoords(finalUrl);
    if (coords) return res.json(coords);

    const html = await response.text();
    const fromHtml = extractCoords(html);
    if (fromHtml) return res.json(fromHtml);

    return res.status(400).json({ error: 'Could not extract coordinates from this link.' });
  } catch (err) {
    return res.status(400).json({ error: 'Failed to resolve link: ' + err.message });
  }
}

function extractCoords(text) {
  let m = text.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  m = text.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  m = text.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };

  m = text.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  m = text.match(/place\/[^/@]*\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  return null;
}
