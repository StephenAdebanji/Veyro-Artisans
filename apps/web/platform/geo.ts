import type { GeoPoint } from "@veyro/contracts";

const EARTH_RADIUS_KM = 6371;

/** Straight-line distance — good enough for ranking many candidates fast. The
 * precise driving ETA shown on the few finalist cards comes from Mapbox
 * Directions (platform/mapbox.ts) instead, which would be too slow to call
 * per-candidate during scoring. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
