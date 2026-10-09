// Reusable geo utility for the Medicine Availability "nearby" search.
// Pure function, no side effects — used by availabilityService.js to filter/sort
// MediLink branches and registered partner shops around the CURRENT branch.

/**
 * Calculates the great-circle distance between two lat/lng points using the
 * Haversine formula. Returns distance in kilometers, rounded to 1 decimal.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === undefined || v === null || Number.isNaN(v))) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}
