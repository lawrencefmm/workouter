import { LiftType } from '../types';

export type ProgramData = {
  weeks: ProgramWeek[];
};

export type ProgramWeek = {
  key: string;
  title: string;
  order: number;
  days: ProgramDay[];
};

export type ProgramDay = {
  title: string;
  order: number;
  exercises: ProgramExercise[];
};

export type ProgramExercise = {
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
