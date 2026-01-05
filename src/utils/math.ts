export function roundToIncrement(value: number, increment: number): number {
  if (!increment) return value;
  return Math.round(value / increment) * increment;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
