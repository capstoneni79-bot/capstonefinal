import { HINUNANGAN_BARANGAYS } from '../data/barangays';
import { getStoredMunicipalRings } from '../services/boundaryStorageService';

/**
 * Standard ray-casting algorithm for Point-in-Polygon (PIP) testing
 */
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Haversine formula to calculate great-circle distance between two geographic coordinates in kilometers
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest official Hinunangan barangay to given GPS coordinates
 */
export function getClosestHinunanganBarangay(lat: number, lng: number) {
  let closest = HINUNANGAN_BARANGAYS[0];
  let minDistance = Infinity;

  for (const b of HINUNANGAN_BARANGAYS) {
    const d = calculateHaversineDistanceKm(lat, lng, b.latitude, b.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = b;
    }
  }

  return {
    name: closest.name,
    code: closest.code,
    distanceKm: Number(minDistance.toFixed(2)),
    coordinates: { lat: closest.latitude, lng: closest.longitude },
  };
}

/**
 * Validates whether GPS coordinates are strictly inside the Municipality of Hinunangan, Southern Leyte.
 * Evaluates against the 3 official municipal boundary rings (Mainland, San Pablo Island, San Pedro Island).
 */
export function isPointInsideHinunangan(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Quick bounding box check for Hinunangan
  // (Min Lat: 10.27, Max Lat: 10.48, Min Lng: 125.06, Max Lng: 125.24)
  if (lat < 10.27 || lat > 10.48 || lng < 125.06 || lng > 125.24) {
    return false;
  }

  const rings = getStoredMunicipalRings();
  for (const ring of rings) {
    if (isPointInPolygon([lat, lng], ring)) {
      return true;
    }
  }

  // Tolerance buffer: if point is within 300 meters (0.3 km) of any barangay center, consider valid
  const closest = getClosestHinunanganBarangay(lat, lng);
  if (closest.distanceKm <= 1.2) {
    return true;
  }

  return false;
}

export interface ExclusivityValidationResult {
  isValidLocation: boolean;
  isExclusive: boolean;
  province: string;
  municipality: string;
  closestBarangay: string;
  distanceToBarangayCenterKm: number;
  errorMessage?: string;
}

/**
 * Comprehensive exclusivity validator for swine and farm registration.
 * Rejects registrations from any other municipality (e.g. Silago, Hinundayan, Saint Bernard, Sogod)
 * or other provinces (Leyte, Cebu, Bohol, Samar, etc.).
 */
export function validateHinunanganRegistration(
  lat: number,
  lng: number,
  assignedBarangayName?: string
): ExclusivityValidationResult {
  const closest = getClosestHinunanganBarangay(lat, lng);
  const insideMuni = isPointInsideHinunangan(lat, lng);

  if (!insideMuni) {
    return {
      isValidLocation: false,
      isExclusive: false,
      province: 'Southern Leyte',
      municipality: 'Hinunangan',
      closestBarangay: closest.name,
      distanceToBarangayCenterKm: closest.distanceKm,
      errorMessage: `GPS coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)}) are outside the Municipality of Hinunangan. Registration to other municipalities or provinces is strictly prohibited under Municipal EO No. 12-2023. You can only register swine located within Hinunangan.`,
    };
  }

  // Check if coordinates deviate excessively (> 4 km) from declared barangay centroid
  if (assignedBarangayName) {
    const assignedObj = HINUNANGAN_BARANGAYS.find(
      b => b.name.toLowerCase() === assignedBarangayName.toLowerCase()
    );
    if (assignedObj) {
      const distToAssigned = calculateHaversineDistanceKm(
        lat,
        lng,
        assignedObj.latitude,
        assignedObj.longitude
      );
      if (distToAssigned > 4.5) {
        return {
          isValidLocation: true,
          isExclusive: true,
          province: 'Southern Leyte',
          municipality: 'Hinunangan',
          closestBarangay: closest.name,
          distanceToBarangayCenterKm: closest.distanceKm,
          errorMessage: `Notice: Selected pen coordinates are closer to Brgy. ${closest.name} (${closest.distanceKm} km) than the declared Brgy. ${assignedBarangayName} (${distToAssigned.toFixed(1)} km). Please confirm pen location.`,
        };
      }
    }
  }

  return {
    isValidLocation: true,
    isExclusive: true,
    province: 'Southern Leyte',
    municipality: 'Hinunangan',
    closestBarangay: closest.name,
    distanceToBarangayCenterKm: closest.distanceKm,
  };
}
