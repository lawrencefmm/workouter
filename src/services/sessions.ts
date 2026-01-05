import { db, Day, OneRepMax, PlannedExercise, Settings } from '../db';
import { LiftType } from '../types';
import { getPercentWeights } from '../utils/percent';

const DEFAULT_SET_COUNT = 1;

function getPlannedSetCount(exercise: PlannedExercise) {
  const warmup = exercise.warmupSetsCount ?? 0;
  const working = exercise.workingSetsCount ?? 0;
  const total = warmup + working;
  return total > 0 ? total : DEFAULT_SET_COUNT;
}

function buildMaxMap(oneRepMaxes: OneRepMax[]) {
  return oneRepMaxes.reduce((map, entry) => {
    map.set(entry.liftType, entry.valueKg);
    return map;
  }, new Map<LiftType, number>());
}

export async function startSession(options: {
  day: Day;
  exercises: PlannedExercise[];
  settings: Settings;
  oneRepMaxes: OneRepMax[];
}) {
  const startedAt = Date.now();
  const sessionId = await db.sessions.add({
    dayId: options.day.id,
    weekKey: options.day.weekKey,
    dayTitle: options.day.title,
    startedAt,
    notes: ''
  });

  const lastUsed = await db.exerciseLastUsed.toArray();
  const lastUsedMap = new Map(lastUsed.map((entry) => [entry.normalizedName, entry.lastWeightKg]));
  const maxMap = buildMaxMap(options.oneRepMaxes);

  const sets = options.exercises.flatMap((exercise) => {
    const totalSets = getPlannedSetCount(exercise);
    const warmupCount = exercise.warmupSetsCount ?? 0;
    let prefillWeight: number | null = null;

    if (
      exercise.percentMin !== null &&
      exercise.percentMax !== null &&
      exercise.primaryLift &&
      maxMap.has(exercise.primaryLift)
    ) {
      const weights = getPercentWeights({
        oneRepMaxKg: maxMap.get(exercise.primaryLift) || 0,
        percentMin: exercise.percentMin,
        percentMax: exercise.percentMax,
        roundingIncrementKg: options.settings.roundingIncrementKg,
        recommendation: options.settings.percentRecommendation
      });
      prefillWeight = weights.recommendedKg;
    } else if (lastUsedMap.has(exercise.normalizedName)) {
      prefillWeight = lastUsedMap.get(exercise.normalizedName) || null;
    }

    return Array.from({ length: totalSets }, (_, index) => ({
      sessionId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      normalizedName: exercise.normalizedName,
      setIndex: index + 1,
      isWarmup: index < warmupCount,
      reps: '',
      weightKg: index < warmupCount ? null : prefillWeight
    }));
  });

  if (sets.length) {
    await db.performedSets.bulkAdd(sets);
  }

  return sessionId;
}
