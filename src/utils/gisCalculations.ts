import { SwineRecord, Barangay, ASFZone } from '../types';
import { HINUNANGAN_BARANGAYS, HinunanganBarangayGeo } from '../data/barangays';
import { HINUNANGAN_BARANGAY_BOUNDARIES } from '../data/hinunanganBoundariesGeoJSON';
import { scaleSequential } from 'd3-scale';
import { interpolateRgb, interpolateRgbBasis } from 'd3-interpolate';

export type HeatmapMode =
  | 'swine_density'
  | 'farmer_density'
  | 'ready_to_sell'
  | 'breeding_boar'
  | 'registry_activity';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0.0 to 1.0 normalized
  rawCount: number;
  label: string;
  barangay: string;
}

export interface BarangayGisMetrics {
  barangayName: string;
  barangayId: string;
  riskLevel: 'green' | 'yellow' | 'red';
  asfZone: ASFZone;
  latitude: number;
  longitude: number;
  registeredFarmers: number;
  totalSwine: number;
  breedingBoars: number;
  breedingSows: number;
  piglets: number;
  growers: number;
  fatteners: number;
  readyForSale: number;
  swineWithGps: number;
  swineWithoutGps: number;
  focalPersonName?: string;
  contactNumber?: string;
  swineRecords: SwineRecord[];
}

/**
 * Filter swine records strictly by focal person authorization if applicable
 */
export function filterSwineByAuthorization(
  swineList: SwineRecord[],
  role: string | undefined,
  assignedBarangay: string | undefined
): SwineRecord[] {
  if (role === 'focal' && assignedBarangay) {
    const target = assignedBarangay.trim().toLowerCase();
    return swineList.filter(s => (s.barangay || '').trim().toLowerCase() === target);
  }
  return swineList;
}

/**
 * Compute comprehensive GIS metrics for barangays based on current Swine Records
 */
export function computeBarangayGisMetrics(
  barangays: Barangay[],
  swineList: SwineRecord[],
  authorizedBarangay?: string
): BarangayGisMetrics[] {
  const targetList = authorizedBarangay
    ? HINUNANGAN_BARANGAYS.filter(b => b.name.toLowerCase() === authorizedBarangay.toLowerCase())
    : HINUNANGAN_BARANGAYS;

  return targetList.map(geo => {
    const liveBg = barangays.find(b => b.name.toLowerCase() === geo.name.toLowerCase());
    const bgSwine = swineList.filter(
      s => (s.barangay || '').trim().toLowerCase() === geo.name.toLowerCase() && !s.isArchived
    );

    const farmersSet = new Set(
      bgSwine.map(s => (s.farmerName || s.farmerContact || '').trim().toLowerCase()).filter(Boolean)
    );

    const boars = bgSwine.filter(s => s.swineType === 'boar').length;
    const sows = bgSwine.filter(s => s.swineType === 'sow').length;
    const piglets = bgSwine.filter(s => s.swineType === 'piglet').length;
    const growers = bgSwine.filter(s => s.swineType === 'grower').length;
    const fatteners = bgSwine.filter(s => s.swineType === 'finisher').length;
    const readyForSale = bgSwine.filter(s => s.readyToSell || s.status === 'ready_to_sell').length;

    const withGps = bgSwine.filter(s => typeof s.latitude === 'number' && typeof s.longitude === 'number' && s.latitude > 0 && s.longitude > 0).length;
    const withoutGps = bgSwine.length - withGps;

    const riskLevel = (liveBg?.riskLevel || geo.defaultRiskLevel) as 'green' | 'yellow' | 'red';
    const asfZone: ASFZone = riskLevel === 'red' ? 'RED' : riskLevel === 'yellow' ? 'YELLOW' : 'GREEN';

    return {
      barangayName: geo.name,
      barangayId: geo.id,
      riskLevel,
      asfZone,
      latitude: geo.latitude,
      longitude: geo.longitude,
      registeredFarmers: farmersSet.size,
      totalSwine: bgSwine.length,
      breedingBoars: boars,
      breedingSows: sows,
      piglets,
      growers,
      fatteners,
      readyForSale,
      swineWithGps: withGps,
      swineWithoutGps: withoutGps,
      focalPersonName: liveBg?.focalPersonName || geo.focalPersonName,
      contactNumber: liveBg?.contactNumber || geo.contactNumber,
      swineRecords: bgSwine,
    };
  });
}

/**
 * Generates heatmap data points from actual database records
 */
export function generateHeatmapPoints(
  metrics: BarangayGisMetrics[],
  mode: HeatmapMode
): { points: HeatmapPoint[]; maxVal: number; minVal: number } {
  const points: HeatmapPoint[] = [];
  let maxVal = 0;
  let minVal = Infinity;

  // 1. Calculate raw values for each barangay
  metrics.forEach(m => {
    let raw = 0;
    switch (mode) {
      case 'swine_density':
        raw = m.totalSwine;
        break;
      case 'farmer_density':
        raw = m.registeredFarmers;
        break;
      case 'ready_to_sell':
        raw = m.readyForSale;
        break;
      case 'breeding_boar':
        raw = m.breedingBoars;
        break;
      case 'registry_activity':
        raw = m.totalSwine + m.readyForSale * 1.5 + m.registeredFarmers * 2;
        break;
    }

    if (raw > maxVal) maxVal = raw;
    if (raw < minVal) minVal = raw;
  });

  if (minVal === Infinity) minVal = 0;
  if (maxVal === 0) maxVal = 1;

  // 2. Build heatmap points from swine records with coordinates + centroid fallback
  metrics.forEach(m => {
    let raw = 0;
    switch (mode) {
      case 'swine_density':
        raw = m.totalSwine;
        break;
      case 'farmer_density':
        raw = m.registeredFarmers;
        break;
      case 'ready_to_sell':
        raw = m.readyForSale;
        break;
      case 'breeding_boar':
        raw = m.breedingBoars;
        break;
      case 'registry_activity':
        raw = m.totalSwine + m.readyForSale * 1.5 + m.registeredFarmers * 2;
        break;
    }

    const intensity = Math.max(0.1, Math.min(1.0, raw / maxVal));

    // Centroid point representing barangay aggregated density
    points.push({
      lat: m.latitude,
      lng: m.longitude,
      intensity,
      rawCount: raw,
      label: `${m.barangayName} (${raw})`,
      barangay: m.barangayName,
    });

    // Also include specific swine coordinates if available
    m.swineRecords.forEach(s => {
      if (s.latitude && s.longitude && s.latitude > 0 && s.longitude > 0) {
        let swineWeight = 1;
        if (mode === 'ready_to_sell' && !s.readyToSell && s.status !== 'ready_to_sell') return;
        if (mode === 'breeding_boar' && s.swineType !== 'boar') return;
        if (mode === 'ready_to_sell') swineWeight = 2;
        if (mode === 'breeding_boar') swineWeight = 2.5;

        points.push({
          lat: s.latitude,
          lng: s.longitude,
          intensity: Math.min(1.0, (swineWeight / (maxVal || 1)) * 1.5),
          rawCount: swineWeight,
          label: `${s.pigIdTag || s.earTagNo} - ${s.farmerName}`,
          barangay: s.barangay,
        });
      }
    });
  });

  return { points, maxVal, minVal };
}

// D3 sequential color scale interpolator for swine density heatmap
const densityColorScale = scaleSequential(
  interpolateRgbBasis(['#10b981', '#34d399', '#facc15', '#fb923c', '#dc2626'])
).domain([0, 1]);

/**
 * Get color gradient for heatmap intensity (0.0 to 1.0) using d3-scale interpolation
 */
export function getHeatmapColor(intensity: number, opacity: number = 0.5): string {
  const clamped = Math.max(0, Math.min(1, intensity));
  const rgbColor = densityColorScale(clamped);
  // Convert rgb/hex to rgba string with specified opacity
  if (rgbColor.startsWith('rgb(')) {
    return rgbColor.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  // If hex or rgb, let's parse or return with opacity or fallback
  return rgbColor;
}
