/**
 * Geodesic distance and spherical polygon area measurement utilities
 * for Hinunangan GIS boundary mapping.
 */

// Earth radius in meters (WGS84 mean radius)
const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the total perimeter of a polygon in kilometers.
 */
export function calculatePerimeterKm(points: [number, number][]): number {
  if (!points || points.length < 2) return 0;
  let totalDistanceMeters = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    totalDistanceMeters += calculateDistanceMeters(p1[0], p1[1], p2[0], p2[1]);
  }

  return Number((totalDistanceMeters / 1000).toFixed(3));
}

/**
 * Calculates the area of a spherical polygon in hectares.
 * 1 Hectare = 10,000 square meters.
 */
export function calculatePolygonAreaHectares(points: [number, number][]): number {
  if (!points || points.length < 3) return 0;

  let totalAngle = 0;
  const numPoints = points.length;

  for (let i = 0; i < numPoints; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    const p3 = points[(i + 2) % numPoints];

    const bearing1 = getBearing(p2[0], p2[1], p1[0], p1[1]);
    const bearing2 = getBearing(p2[0], p2[1], p3[0], p3[1]);

    let angle = bearing2 - bearing1;
    if (angle < 0) angle += 360;
    totalAngle += angle;
  }

  // Planar approximation for local municipality scales (Hinunangan barangays ~1-5 km)
  // Shoelace formula with latitude cos projection:
  let areaSquareMeters = 0;
  const avgLat = (points.reduce((acc, p) => acc + p[0], 0) / numPoints) * (Math.PI / 180);
  const metersPerDegLat = 111132.95;
  const metersPerDegLng = 111412.84 * Math.cos(avgLat);

  for (let i = 0; i < numPoints; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];

    const x1 = p1[1] * metersPerDegLng;
    const y1 = p1[0] * metersPerDegLat;
    const x2 = p2[1] * metersPerDegLng;
    const y2 = p2[0] * metersPerDegLat;

    areaSquareMeters += x1 * y2 - x2 * y1;
  }

  areaSquareMeters = Math.abs(areaSquareMeters) / 2;
  const hectares = areaSquareMeters / 10000;
  return Number(hectares.toFixed(2));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Generates an initial regular polygon boundary around a center coordinate.
 * Default radius is approx 750 meters.
 */
export function generateDefaultBoundary(
  centerLat: number,
  centerLng: number,
  radiusKm = 0.75,
  vertexCount = 6
): [number, number][] {
  const points: [number, number][] = [];
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    // Slight variance to look natural
    const variance = 0.85 + (i % 2 === 0 ? 0.25 : -0.1);
    const lat = centerLat + latDelta * Math.sin(angle) * variance;
    const lng = centerLng + lngDelta * Math.cos(angle) * variance;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  return points;
}
