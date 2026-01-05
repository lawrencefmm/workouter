export type Theme = 'system' | 'light' | 'dark';
export type PercentRecommendation = 'mid' | 'min' | 'max';
export type LiftType = 'SQUAT' | 'BENCH' | 'DEADLIFT' | 'OHP';

export const liftLabels: Record<LiftType, string> = {
  SQUAT: 'Squat',
  BENCH: 'Bench Press',
  DEADLIFT: 'Deadlift',
  OHP: 'Overhead Press'
};
