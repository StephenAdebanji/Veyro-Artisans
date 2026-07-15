import type { GeoPoint } from "@veyro/contracts";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(address)}&access_token=${MAPBOX_TOKEN}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const [lng, lat] = data.features?.[0]?.geometry?.coordinates ?? [];
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

export async function geocodeStructured(parts: {
  streetAddress?: string;
  lga?: string;
  state?: string;
  countryCode?: string;
}): Promise<GeoPoint | null> {
  const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, limit: "1" });
  if (parts.streetAddress) params.set("address_line1", parts.streetAddress);
  if (parts.lga) params.set("place", parts.lga);
  if (parts.state) params.set("region", parts.state);
  if (parts.countryCode) params.set("country", parts.countryCode);

  const url = `https://api.mapbox.com/search/geocode/v6/forward?${params}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const [lng, lat] = data.features?.[0]?.geometry?.coordinates ?? [];
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

export async function getDistanceEta(
  from: GeoPoint,
  to: GeoPoint,
): Promise<{ distanceKm: number; etaMinutes: number } | null> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    distanceKm: route.distance / 1000,
    etaMinutes: route.duration / 60,
  };
}
