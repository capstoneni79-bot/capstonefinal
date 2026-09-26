import { parseShp, parseDbf, combine } from 'shpjs';
import type { FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson';
import { calculatePerimeterKm, calculatePolygonAreaHectares } from './gisMeasure';

export interface ImportedBarangayFeature {
  name: string;
  code?: string;
  adminLevel?: string;
  polygon: [number, number][]; // [lat, lng][] Leaflet format
  googlePath: { lat: number; lng: number }[];
  centroid: [number, number]; // [lat, lng]
  areaHectares: number;
  perimeterKm: number;
  properties: Record<string, any>;
}

export interface ImportedMapResult {
  sourceName: string;
  importedAt: string;
  featureCount: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  center: [number, number]; // [lat, lng]
  features: ImportedBarangayFeature[];
  geoJson: FeatureCollection;
}

// Compute centroid of polygon
function computePolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [10.395, 125.195];
  let sumLat = 0;
  let sumLng = 0;
  coords.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return [sumLat / coords.length, sumLng / coords.length];
}

// Process GeoJSON FeatureCollection into structured map result
export function processGeoJsonToMapResult(
  geoJson: FeatureCollection<Geometry, any>,
  sourceName: string
): ImportedMapResult {
  const bounds = {
    minLat: 90,
    maxLat: -90,
    minLng: 180,
    maxLng: -180,
  };

  const features: ImportedBarangayFeature[] = [];

  geoJson.features.forEach((feat, index) => {
    const props = feat.properties || {};
    // Identify barangay name from common shapefile attributes
    const name: string =
      props.shape4 ||
      props.name ||
      props.ADM4_EN ||
      props.NAME_4 ||
      props.Bgy_Name ||
      props.BARANGAY ||
      props.admin_name ||
      `Barangay ${index + 1}`;

    let rawCoords: number[][] = [];

    if (feat.geometry.type === 'Polygon') {
      const poly = feat.geometry as Polygon;
      if (poly.coordinates && poly.coordinates.length > 0) {
        rawCoords = poly.coordinates[0];
      }
    } else if (feat.geometry.type === 'MultiPolygon') {
      const multi = feat.geometry as MultiPolygon;
      if (multi.coordinates && multi.coordinates.length > 0 && multi.coordinates[0].length > 0) {
        // Use largest polygon
        let maxLen = 0;
        multi.coordinates.forEach(poly => {
          if (poly[0].length > maxLen) {
            maxLen = poly[0].length;
            rawCoords = poly[0];
          }
        });
      }
    }

    if (rawCoords.length >= 3) {
      // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
      const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => {
        if (lat < bounds.minLat) bounds.minLat = lat;
        if (lat > bounds.maxLat) bounds.maxLat = lat;
        if (lng < bounds.minLng) bounds.minLng = lng;
        if (lng > bounds.maxLng) bounds.maxLng = lng;
        return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
      });

      const googlePath = leafletCoords.map(([lat, lng]) => ({ lat, lng }));
      const centroid = computePolygonCentroid(leafletCoords);
      const areaHectares = calculatePolygonAreaHectares(leafletCoords);
      const perimeterKm = calculatePerimeterKm(leafletCoords);

      features.push({
        name,
        code: props.code || props.serial_id?.toString(),
        adminLevel: props.admin_leve,
        polygon: leafletCoords,
        googlePath,
        centroid,
        areaHectares: Number(areaHectares.toFixed(2)),
        perimeterKm: Number(perimeterKm.toFixed(2)),
        properties: props,
      });
    }
  });

  const center: [number, number] = [
    (bounds.minLat + bounds.maxLat) / 2 || 10.395,
    (bounds.minLng + bounds.maxLng) / 2 || 125.195,
  ];

  return {
    sourceName,
    importedAt: new Date().toISOString(),
    featureCount: features.length,
    bounds,
    center,
    features,
    geoJson,
  };
}

/**
 * Import shapefile from raw ArrayBuffers (.shp + optional .dbf)
 */
export async function importShapefileBuffers(
  shpBuffer: ArrayBuffer,
  dbfBuffer?: ArrayBuffer,
  sourceName = 'imported_shapefile.shp'
): Promise<ImportedMapResult> {
  const shpGeometries = parseShp(shpBuffer);
  let geoJson: FeatureCollection;

  if (dbfBuffer) {
    const dbfRecords = parseDbf(dbfBuffer);
    geoJson = combine([shpGeometries, dbfRecords]);
  } else {
    geoJson = combine([shpGeometries, []]);
  }

  return processGeoJsonToMapResult(geoJson, sourceName);
}

/**
 * Fetch and import the official Hinunangan barangay_level_4 Shapefile
 * from the app's local data folder or GitHub repo
 */
export async function loadOfficialHinunanganShp(): Promise<ImportedMapResult> {
  try {
    const [shpRes, dbfRes] = await Promise.all([
      fetch('/data/barangay_level_4/barangay_level_4.shp'),
      fetch('/data/barangay_level_4/barangay_level_4.dbf'),
    ]);

    if (shpRes.ok && dbfRes.ok) {
      const [shpBuf, dbfBuf] = await Promise.all([
        shpRes.arrayBuffer(),
        dbfRes.arrayBuffer(),
      ]);
      return await importShapefileBuffers(
        shpBuf,
        dbfBuf,
        'barangay_level_4.shp (Hinunangan Official Cadastral)'
      );
    }
  } catch (err) {
    console.warn('Direct .shp fetch failed, attempting geojson fallback:', err);
  }

  // Fallback to pre-processed GeoJSON if binary fetch is restricted
  const geojsonRes = await fetch('/data/barangay_level_4.geojson');
  if (!geojsonRes.ok) {
    throw new Error('Could not load official Hinunangan map dataset');
  }
  const geojson = await geojsonRes.json();
  return processGeoJsonToMapResult(geojson, 'barangay_level_4.shp (Hinunangan Official Cadastral)');
}
