import { PercentRecommendation } from '../types';
import { roundToIncrement } from './math';

export type PercentWeights = {
  minKg: number;
  maxKg: number;
  recommendedKg: number;
};

export function getPercentWeights(options: {
  oneRepMaxKg: number;
  percentMin: number;
  percentMax: number;
  roundingIncrementKg: number;
  recommendation: PercentRecommendation;
}): PercentWeights {
  const rawMin = options.oneRepMaxKg * (options.percentMin / 100);
  const rawMax = options.oneRepMaxKg * (options.percentMax / 100);
  const roundedMin = roundToIncrement(rawMin, options.roundingIncrementKg);
  const roundedMax = roundToIncrement(rawMax, options.roundingIncrementKg);
  let rawRecommended = (rawMin + rawMax) / 2;

  if (options.recommendation === 'min') {
    rawRecommended = rawMin;
  }

  if (options.recommendation === 'max') {
    rawRecommended = rawMax;
  }

  return {
    minKg: roundedMin,
    maxKg: roundedMax,
    recommendedKg: roundToIncrement(rawRecommended, options.roundingIncrementKg)
  };
}
