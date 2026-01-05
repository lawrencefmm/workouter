import Dexie, { Table } from 'dexie';
import { LiftType, PercentRecommendation, Theme } from './types';

export type Settings = {
  id: 'singleton';
  theme: Theme;
  roundingIncrementKg: 1.25 | 2.5 | 5;
  percentRecommendation: PercentRecommendation;
  currentWeekKey: string | null;
  programVersion: string;
};

export type OneRepMax = {
  liftType: LiftType;
  valueKg: number;
  updatedAt: number;
};

export type Week = {
  key: string;
  title: string;
  order: number;
};

export type Day = {
  id: string;
  weekKey: string;
  title: string;
  order: number;
};

export type PlannedExercise = {
  id: string;
  dayId: string;
  weekKey: string;
  order: number;
  name: string;
  normalizedName: string;
  supersetGroup: string | null;
  warmupSets: string;
  workingSets: string;
  warmupSetsCount: number | null;
  workingSetsCount: number | null;
  repsPlanned: string;
  load: string;
  percentMin: number | null;
  percentMax: number | null;
  rpe: string;
  rest: string;
  notes: string;
  primaryLift: LiftType | null;
};

export type Session = {
  id?: number;
  dayId: string;
  weekKey: string;
  dayTitle: string;
  startedAt: number;
  endedAt?: number;
  notes: string;
};

export type PerformedSet = {
  id?: number;
  sessionId: number;
  exerciseId: string;
  exerciseName: string;
  normalizedName: string;
  setIndex: number;
  isWarmup: boolean;
  reps: string;
  weightKg: number | null;
  notes?: string;
};

export type ExerciseLastUsed = {
  normalizedName: string;
  lastWeightKg: number;
  updatedAt: number;
};

export type PersonalRecord = {
  id?: number;
  liftType: LiftType;
  date: number;
  valueKg: number;
  reps?: number | null;
  notes?: string;
};

class WorkouterDB extends Dexie {
  settings!: Table<Settings, string>;
  oneRepMaxes!: Table<OneRepMax, LiftType>;
  weeks!: Table<Week, string>;
  days!: Table<Day, string>;
  plannedExercises!: Table<PlannedExercise, string>;
  sessions!: Table<Session, number>;
  performedSets!: Table<PerformedSet, number>;
  exerciseLastUsed!: Table<ExerciseLastUsed, string>;
  personalRecords!: Table<PersonalRecord, number>;

  constructor() {
    super('workouter');
    this.version(1).stores({
      settings: '&id',
      oneRepMaxes: '&liftType, updatedAt',
      weeks: '&key, order',
      days: '&id, weekKey, order',
      plannedExercises: '&id, dayId, weekKey, order, normalizedName',
      sessions: '++id, weekKey, dayId, startedAt',
      performedSets: '++id, sessionId, exerciseId, normalizedName',
      exerciseLastUsed: '&normalizedName, updatedAt',
      personalRecords: '++id, liftType, date'
    });
  }
}

export const db = new WorkouterDB();
