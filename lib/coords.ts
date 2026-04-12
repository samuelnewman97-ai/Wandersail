export interface ParsedCoords {
  lat: number;
  lng: number;
}

/**
 * Parse coordinates from a variety of common formats:
 *
 *   "21.3099, -157.8581"          (Google Maps copy-paste)
 *   "21.3099,-157.8581"
 *   "21.3099 -157.8581"
 *   "21.3099° N, 157.8581° W"      (with hemisphere letters)
 *   "21°18'35.6\"N 157°51'29.2\"W" (DMS)
 *
 * Latitude is clamped to [-90, 90], longitude to [-180, 180]. Returns
 * null if the string can't be parsed into a valid coordinate pair.
 */
export function parseCoordinates(input: string): ParsedCoords | null {
  const raw = input.trim();
  if (!raw) return null;

  // Try DMS format first (degrees/minutes/seconds with hemisphere letters)
  const dms = parseDMS(raw);
  if (dms) return clamp(dms);

  // Try "lat[° N], lng[° W]" or "lat, lng"
  const hemisphere = parseWithHemispheres(raw);
  if (hemisphere) return clamp(hemisphere);

  // Fallback: two plain numbers separated by comma/space
  const numbers = raw.match(/-?\d+(?:\.\d+)?/g);
  if (numbers && numbers.length >= 2) {
    const lat = Number(numbers[0]);
    const lng = Number(numbers[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return clamp({ lat, lng });
    }
  }

  return null;
}

function parseWithHemispheres(raw: string): ParsedCoords | null {
  // "21.3099° N, 157.8581° W"  or  "21.3099 N 157.8581 W"
  const re = /(-?\d+(?:\.\d+)?)\s*°?\s*([NSns])[,\s]+(-?\d+(?:\.\d+)?)\s*°?\s*([EWew])/;
  const m = raw.match(re);
  if (!m) return null;
  const latAbs = Math.abs(Number(m[1]));
  const lngAbs = Math.abs(Number(m[3]));
  const lat = m[2].toUpperCase() === "S" ? -latAbs : latAbs;
  const lng = m[4].toUpperCase() === "W" ? -lngAbs : lngAbs;
  return { lat, lng };
}

function parseDMS(raw: string): ParsedCoords | null {
  // 21°18'35.6"N 157°51'29.2"W
  const re =
    /(\d+)°\s*(\d+)?['′]?\s*(\d+(?:\.\d+)?)?["″]?\s*([NSns])[,\s]+(\d+)°\s*(\d+)?['′]?\s*(\d+(?:\.\d+)?)?["″]?\s*([EWew])/;
  const m = raw.match(re);
  if (!m) return null;
  const latDeg = Number(m[1]);
  const latMin = Number(m[2] ?? 0);
  const latSec = Number(m[3] ?? 0);
  const lngDeg = Number(m[5]);
  const lngMin = Number(m[6] ?? 0);
  const lngSec = Number(m[7] ?? 0);
  const lat = (latDeg + latMin / 60 + latSec / 3600) * (m[4].toUpperCase() === "S" ? -1 : 1);
  const lng = (lngDeg + lngMin / 60 + lngSec / 3600) * (m[8].toUpperCase() === "W" ? -1 : 1);
  return { lat, lng };
}

function clamp(c: ParsedCoords): ParsedCoords {
  return {
    lat: Math.max(-90, Math.min(90, c.lat)),
    lng: Math.max(-180, Math.min(180, c.lng)),
  };
}

/**
 * Format a signed coord as human-readable with hemisphere letter,
 * e.g. 21.3099 → "21.3099° N", -157.8581 → "157.8581° W".
 */
export function formatLat(lat: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
}

export function formatLng(lng: number): string {
  return `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
}
