const RESOLVER_URL = '/api/resolve';

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

export async function parseGoogleMapsLink(url) {
  // Try direct extraction first
  const direct = extractCoords(url);
  if (direct) return direct;

  // For short links and other Google Maps URLs, use server resolver
  const response = await fetch(RESOLVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to resolve link');

  return data;
}
