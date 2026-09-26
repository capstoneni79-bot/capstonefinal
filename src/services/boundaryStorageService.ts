import {
  HINUNANGAN_BARANGAY_BOUNDARIES,
  HINUNANGAN_MUNICIPAL_RINGS,
  HINUNANGAN_MUNICIPAL_METADATA,
  HINUNANGAN_MUNICIPAL_GEOJSON_FEATURE,
  HINUNANGAN_GEOJSON,
} from '../data/hinunanganBoundariesGeoJSON';

export const BOUNDARY_STORAGE_KEYS = {
  MUNICIPAL_RINGS: 'hinunangan_municipal_boundary_rings_v4_level4',
  BARANGAY_BOUNDARIES: 'hinunangan_barangay_boundaries_dict_v4_level4',
  STORAGE_METADATA: 'hinunangan_boundary_storage_meta_v4_level4',
  CUSTOM_OVERLAYS: 'hinunangan_custom_gis_overlays_v4_level4',
} as const;

export interface BoundaryStorageMeta {
  version: string;
  cachedAt: string;
  source: string;
  psgc: string;
  municipality: string;
  province: string;
  areaKm2: number;
  perimeterKm: number;
  totalBarangays: number;
  isCustomized: boolean;
  offlineReady: boolean;
}

/**
 * Initializes local storage with official surveyed boundaries if not already present.
 * Returns true if successfully ready for offline use.
 */
export function initBoundaryStorage(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const existingMeta = localStorage.getItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA);
    const existingMuni = localStorage.getItem(BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS);
    const existingBgys = localStorage.getItem(BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES);

    if (!existingMeta || !existingMuni || !existingBgys) {
      // Seed official survey boundaries to localStorage
      localStorage.setItem(
        BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS,
        JSON.stringify(HINUNANGAN_MUNICIPAL_RINGS)
      );
      localStorage.setItem(
        BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES,
        JSON.stringify(HINUNANGAN_BARANGAY_BOUNDARIES)
      );

      const meta: BoundaryStorageMeta = {
        version: '4.0-github-barangay-level-4',
        cachedAt: new Date().toISOString(),
        source: HINUNANGAN_MUNICIPAL_METADATA.source,
        psgc: HINUNANGAN_MUNICIPAL_METADATA.psgc,
        municipality: HINUNANGAN_MUNICIPAL_METADATA.fullName,
        province: HINUNANGAN_MUNICIPAL_METADATA.province,
        areaKm2: HINUNANGAN_MUNICIPAL_METADATA.areaKm2,
        perimeterKm: HINUNANGAN_MUNICIPAL_METADATA.perimeterKm,
        totalBarangays: HINUNANGAN_MUNICIPAL_METADATA.totalBarangays,
        isCustomized: false,
        offlineReady: true,
      };

      localStorage.setItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA, JSON.stringify(meta));
    }
    return true;
  } catch (err) {
    console.warn('Failed to access localStorage for boundary caching:', err);
    return false;
  }
}

/**
 * Retrieves the municipal boundary rings from localStorage (fallback to bundled survey data).
 * Returns array of 3 rings: [Ring 0 (San Pablo), Ring 1 (Mainland), Ring 2 (San Pedro)]
 * Each ring is [latitude, longitude][]
 */
export function getStoredMunicipalRings(): [number, number][][] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading municipal boundary from localStorage:', e);
    }
  }
  return HINUNANGAN_MUNICIPAL_RINGS;
}

/**
 * Retrieves municipal boundary in Google Maps path format ({ lat: number, lng: number }[][])
 */
export function getStoredMunicipalGooglePaths(): { lat: number; lng: number }[][] {
  const rings = getStoredMunicipalRings();
  return rings.map(ring => ring.map(([lat, lng]) => ({ lat, lng })));
}

/**
 * Retrieves the 40 barangay boundaries map from localStorage (fallback to bundled survey data).
 */
export function getStoredBarangayBoundaries(): { [barangayName: string]: [number, number][] } {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading barangay boundaries from localStorage:', e);
    }
  }
  return HINUNANGAN_BARANGAY_BOUNDARIES;
}

/**
 * Saves or updates a specific barangay's boundary polygon in local storage
 */
export function saveBarangayBoundary(barangayName: string, polygon: [number, number][]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const current = getStoredBarangayBoundaries();
    current[barangayName] = polygon;
    localStorage.setItem(BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES, JSON.stringify(current));

    // Update metadata
    updateStorageMeta({ isCustomized: true, cachedAt: new Date().toISOString() });
    notifyBoundaryUpdate();
    return true;
  } catch (err) {
    console.error(`Failed to save boundary for ${barangayName}:`, err);
    return false;
  }
}

/**
 * Saves customized municipal boundary rings in local storage
 */
export function saveMunicipalRings(rings: [number, number][][]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS, JSON.stringify(rings));
    updateStorageMeta({ isCustomized: true, cachedAt: new Date().toISOString() });
    notifyBoundaryUpdate();
    return true;
  } catch (err) {
    console.error('Failed to save municipal rings:', err);
    return false;
  }
}

/**
 * Resets local storage boundary data back to official NAMRIA/PSA survey dataset
 */
export function resetBoundariesToOfficial(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(
      BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS,
      JSON.stringify(HINUNANGAN_MUNICIPAL_RINGS)
    );
    localStorage.setItem(
      BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES,
      JSON.stringify(HINUNANGAN_BARANGAY_BOUNDARIES)
    );

    const meta: BoundaryStorageMeta = {
      version: '4.0-github-barangay-level-4',
      cachedAt: new Date().toISOString(),
      source: HINUNANGAN_MUNICIPAL_METADATA.source,
      psgc: HINUNANGAN_MUNICIPAL_METADATA.psgc,
      municipality: HINUNANGAN_MUNICIPAL_METADATA.fullName,
      province: HINUNANGAN_MUNICIPAL_METADATA.province,
      areaKm2: HINUNANGAN_MUNICIPAL_METADATA.areaKm2,
      perimeterKm: HINUNANGAN_MUNICIPAL_METADATA.perimeterKm,
      totalBarangays: HINUNANGAN_MUNICIPAL_METADATA.totalBarangays,
      isCustomized: false,
      offlineReady: true,
    };
    localStorage.setItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA, JSON.stringify(meta));
    notifyBoundaryUpdate();
    return true;
  } catch (err) {
    console.error('Failed to reset boundaries:', err);
    return false;
  }
}

/**
 * Helper to update metadata fields
 */
function updateStorageMeta(partial: Partial<BoundaryStorageMeta>) {
  try {
    const raw = localStorage.getItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA);
    let meta: BoundaryStorageMeta;
    if (raw) {
      meta = { ...JSON.parse(raw), ...partial };
    } else {
      meta = {
        version: '2.0-psgc-survey',
        cachedAt: new Date().toISOString(),
        source: HINUNANGAN_MUNICIPAL_METADATA.source,
        psgc: HINUNANGAN_MUNICIPAL_METADATA.psgc,
        municipality: HINUNANGAN_MUNICIPAL_METADATA.fullName,
        province: HINUNANGAN_MUNICIPAL_METADATA.province,
        areaKm2: HINUNANGAN_MUNICIPAL_METADATA.areaKm2,
        perimeterKm: HINUNANGAN_MUNICIPAL_METADATA.perimeterKm,
        totalBarangays: HINUNANGAN_MUNICIPAL_METADATA.totalBarangays,
        isCustomized: false,
        offlineReady: true,
        ...partial,
      };
    }
    localStorage.setItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to update storage metadata:', e);
  }
}

/**
 * Retrieves the current boundary storage status
 */
export function getBoundaryStorageStatus(): {
  isCached: boolean;
  meta: BoundaryStorageMeta | null;
  approxStorageKb: number;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { isCached: false, meta: null, approxStorageKb: 0 };
  }

  try {
    const rawMeta = localStorage.getItem(BOUNDARY_STORAGE_KEYS.STORAGE_METADATA);
    const rawMuni = localStorage.getItem(BOUNDARY_STORAGE_KEYS.MUNICIPAL_RINGS) || '';
    const rawBgys = localStorage.getItem(BOUNDARY_STORAGE_KEYS.BARANGAY_BOUNDARIES) || '';

    const approxStorageKb = Math.round(
      ((rawMeta?.length || 0) + rawMuni.length + rawBgys.length) / 1024
    );

    if (rawMeta) {
      return {
        isCached: true,
        meta: JSON.parse(rawMeta),
        approxStorageKb,
      };
    }
  } catch (err) {
    console.error('Error fetching boundary storage status:', err);
  }

  return { isCached: false, meta: null, approxStorageKb: 0 };
}

/**
 * Exports the complete official Hinunangan dataset (Municipal Outer Perimeter + 40 Barangays)
 * as a downloadable RFC 7946 GeoJSON FeatureCollection string.
 */
export function exportAllBoundariesGeoJSON(): string {
  const muniRings = getStoredMunicipalRings();
  const bgys = getStoredBarangayBoundaries();

  const municipalFeature = {
    type: 'Feature' as const,
    id: 'MUNICIPALITY_HINUNANGAN',
    properties: {
      ...HINUNANGAN_MUNICIPAL_GEOJSON_FEATURE.properties,
      exportedAt: new Date().toISOString(),
    },
    geometry: {
      type: 'MultiPolygon' as const,
      coordinates: muniRings.map(ring => [ring.map(([lat, lng]) => [lng, lat])]),
    },
  };

  const barangayFeatures = HINUNANGAN_GEOJSON.features.map(f => {
    const storedRing = bgys[f.properties.name];
    const coordinates = storedRing
      ? [storedRing.map(([lat, lng]) => [lng, lat])]
      : f.geometry.coordinates;

    return {
      ...f,
      geometry: {
        type: 'Polygon' as const,
        coordinates,
      },
    };
  });

  const fullCollection = {
    type: 'FeatureCollection' as const,
    name: 'Hinunangan_Municipal_And_Barangay_Boundaries_Official_Survey',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    metadata: HINUNANGAN_MUNICIPAL_METADATA,
    features: [municipalFeature, ...barangayFeatures],
  };

  return JSON.stringify(fullCollection, null, 2);
}

/**
 * Dispatches event to notify map components to reload stored boundaries
 */
function notifyBoundaryUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hinunangan-boundaries-updated'));
  }
}
