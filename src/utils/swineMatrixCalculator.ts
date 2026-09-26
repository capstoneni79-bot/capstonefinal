import { SwineType } from '../types';

export interface SwineAgeDetails {
  days: number;
  weeks: number;
  months: number;
  displayText: string;
}

export interface GrowthMatrixStage {
  category: SwineType;
  categoryLabel: string;
  ageDaysRange: [number, number];
  ageWeeksRange: [number, number];
  targetWeightRangeKg: [number, number];
  benchmarkDailyGainGram: number;
  recommendedFeed: string;
  feedIntakePerDayKg: number;
  marketReadiness: string;
  description: string;
}

export const SWINE_GROWTH_MATRIX: GrowthMatrixStage[] = [
  {
    category: 'piglet',
    categoryLabel: 'Piglet / Suckling (Pasuso)',
    ageDaysRange: [0, 30],
    ageWeeksRange: [0, 4.3],
    targetWeightRangeKg: [1.4, 9],
    benchmarkDailyGainGram: 250,
    recommendedFeed: 'Sow Milk + Booster / Creep Feed',
    feedIntakePerDayKg: 0.2,
    marketReadiness: 'Nursery / Nursing stage',
    description: 'Nursing phase. Requires warm dry pen, colostrum within first 6 hours, iron injection, and biosecure nursing crate.',
  },
  {
    category: 'piglet',
    categoryLabel: 'Weanling (Biik na Naawat)',
    ageDaysRange: [31, 60],
    ageWeeksRange: [4.4, 8.5],
    targetWeightRangeKg: [9, 22],
    benchmarkDailyGainGram: 450,
    recommendedFeed: 'Pre-starter to Starter Pellet',
    feedIntakePerDayKg: 0.9,
    marketReadiness: 'Weaned stock (Sold as biik for fattening)',
    description: 'Transition phase. Highly vulnerable to gut stress. Strictly no swill feeding. Water acidification and clean footbaths critical.',
  },
  {
    category: 'grower',
    categoryLabel: 'Grower (Lumalaking Baboy)',
    ageDaysRange: [61, 120],
    ageWeeksRange: [8.6, 17.1],
    targetWeightRangeKg: [22, 60],
    benchmarkDailyGainGram: 650,
    recommendedFeed: 'Grower Mash / Pellet (16% Crude Protein)',
    feedIntakePerDayKg: 1.8,
    marketReadiness: 'Rapid muscle & bone development phase',
    description: 'Fast lean muscle deposition. Deworming and hog cholera / mycoplasma vaccination schedule verification required.',
  },
  {
    category: 'finisher',
    categoryLabel: 'Finisher (Handa sa Palengke / Katayan)',
    ageDaysRange: [121, 190],
    ageWeeksRange: [17.2, 27.1],
    targetWeightRangeKg: [60, 110],
    benchmarkDailyGainGram: 750,
    recommendedFeed: 'Finisher Pellet (14% Crude Protein)',
    feedIntakePerDayKg: 2.5,
    marketReadiness: 'PRIME MARKET READY (Ready for Take-Off & Slaughter)',
    description: 'Optimal feed conversion for commercial slaughter. Liveweight between 85-100 kg receives peak municipal farmgate price.',
  },
  {
    category: 'sow',
    categoryLabel: 'Breeder Sow (Inahin)',
    ageDaysRange: [191, 1800],
    ageWeeksRange: [27.2, 257],
    targetWeightRangeKg: [120, 250],
    benchmarkDailyGainGram: 300,
    recommendedFeed: 'Gestating / Lactating Sow Feed',
    feedIntakePerDayKg: 2.2,
    marketReadiness: 'Breeder Stock (Litter production)',
    description: 'Mature breeding female. Requires individual gestation stalls or biosecure group pens with strict reproductive health monitoring.',
  },
  {
    category: 'boar',
    categoryLabel: 'Breeder Boar (Barako)',
    ageDaysRange: [191, 1800],
    ageWeeksRange: [27.2, 257],
    targetWeightRangeKg: [140, 300],
    benchmarkDailyGainGram: 350,
    recommendedFeed: 'Breeder Boar Ration with Vitamin E & Zinc',
    feedIntakePerDayKg: 2.4,
    marketReadiness: 'Breeder Sire (Semen/Service breeding)',
    description: 'Active sire. High biosecurity isolation pen needed to prevent regional venereal and respiratory disease transmission.',
  },
];

/**
 * Calculates days, weeks, and months from a given birth date.
 */
export function calculateAgeFromBirthDate(birthDateStr: string): SwineAgeDetails {
  if (!birthDateStr) {
    return { days: 154, weeks: 22, months: 5.1, displayText: '154 Days Old' };
  }
  const birth = new Date(birthDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - birth.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Number((days / 7).toFixed(1));
  const months = Number((days / 30.4375).toFixed(1));

  return {
    days,
    weeks,
    months,
    displayText: `${days} Days Old`,
  };
}

/**
 * Calculates birth date backwards from days
 */
export function calculateBirthDateFromDays(days: number): string {
  const d = new Date(Date.now() - Math.max(1, days) * 86400000);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates birth date backwards from weeks
 */
export function calculateBirthDateFromWeeks(weeks: number): string {
  const days = Math.round(weeks * 7);
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().split('T')[0];
}

/**
 * Auto-determines the Swine Category based on Age (in days) and Weight (in kg)
 */
export function autoDetermineSwineCategory(
  ageDays: number,
  weightKg: number,
  gender: 'male' | 'female' | 'castrated'
): SwineType {
  if (gender === 'female' && (ageDays > 210 || weightKg >= 115)) {
    return 'sow';
  }
  if (gender === 'male' && (ageDays > 210 || weightKg >= 120)) {
    return 'boar';
  }
  if (ageDays <= 30 || weightKg <= 9) {
    return 'piglet';
  }
  if (ageDays <= 60 || weightKg <= 22) {
    return 'piglet'; // Weanling
  }
  if (ageDays <= 120 || weightKg <= 58) {
    return 'grower';
  }
  return 'finisher';
}

/**
 * Estimates standard benchmark weight (kg) from Age in Days
 */
export function estimateWeightFromAgeDays(ageDays: number): number {
  if (ageDays <= 0) return 1.5;
  if (ageDays <= 14) return Number((1.5 + ageDays * 0.2).toFixed(1));
  if (ageDays <= 30) return Number((4.3 + (ageDays - 14) * 0.28).toFixed(1));
  if (ageDays <= 60) return Number((8.8 + (ageDays - 30) * 0.44).toFixed(1));
  if (ageDays <= 90) return Number((22.0 + (ageDays - 60) * 0.62).toFixed(1));
  if (ageDays <= 120) return Number((40.6 + (ageDays - 90) * 0.72).toFixed(1));
  if (ageDays <= 150) return Number((62.2 + (ageDays - 120) * 0.78).toFixed(1));
  if (ageDays <= 180) return Number((85.6 + (ageDays - 150) * 0.75).toFixed(1));
  if (ageDays <= 220) return Number((108.1 + (ageDays - 180) * 0.65).toFixed(1));
  return Number((134.0 + (ageDays - 220) * 0.25).toFixed(1));
}

/**
 * Standard Philippine Livestock Tape Measurement Formula:
 * Weight (kg) = (Heart Girth in cm)² × Body Length in cm / 11,877
 *
 * Heart Girth: circumference around the body just behind the front legs.
 * Body Length: distance from base of ears to base of the tail along the backbone.
 */
export function calculateWeightFromTapeFormula(heartGirthCm: number, bodyLengthCm: number): number {
  if (!heartGirthCm || !bodyLengthCm || heartGirthCm <= 0 || bodyLengthCm <= 0) {
    return 0;
  }
  const weight = (Math.pow(heartGirthCm, 2) * bodyLengthCm) / 11877;
  return Number(weight.toFixed(1));
}

/**
 * Calculates estimated market price based on live weight and municipal farmgate rate
 */
export function calculateEstimatedMarketPrice(weightKg: number, ratePerKg: number = 180): number {
  return Math.round(weightKg * ratePerKg);
}

/**
 * Evaluates environmental & zoning setback buffer compliance
 */
export function evaluateSetbackBuffers(
  distanceWater: number,
  distanceTourismSchool: number,
  distanceBuiltUp: number
): {
  waterCompliant: boolean;
  tourismSchoolCompliant: boolean;
  builtUpCompliant: boolean;
  allCompliant: boolean;
  violationsCount: number;
} {
  const waterCompliant = distanceWater > 25;
  const tourismSchoolCompliant = distanceTourismSchool > 200;
  const builtUpCompliant = distanceBuiltUp > 50;

  const violationsCount =
    (waterCompliant ? 0 : 1) + (tourismSchoolCompliant ? 0 : 1) + (builtUpCompliant ? 0 : 1);

  return {
    waterCompliant,
    tourismSchoolCompliant,
    builtUpCompliant,
    allCompliant: violationsCount === 0,
    violationsCount,
  };
}
