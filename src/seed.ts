import { db, Settings } from './db';
import { programData, programVersion } from './data/program';

const orderedWeeks = [...programData.weeks].sort((a, b) => a.order - b.order);

const defaultSettings: Settings = {
  id: 'singleton',
  theme: 'system',
  roundingIncrementKg: 2.5,
  percentRecommendation: 'mid',
  currentWeekKey: orderedWeeks[0]?.key ?? null,
  programVersion
};

export async function seedProgramIfNeeded() {
  const existing = await db.settings.get('singleton');
  const weeks = [...orderedWeeks];
  const shouldSeed = !existing || existing.programVersion !== programVersion;

  await db.transaction('rw', db.settings, db.weeks, db.days, db.plannedExercises, async () => {
    if (shouldSeed) {
      await db.weeks.clear();
      await db.days.clear();
      await db.plannedExercises.clear();
      const weekRows = [];
      const dayRows = [];
      const exerciseRows = [];

      for (const week of weeks) {
        weekRows.push({
          key: week.key,
          title: week.title,
          order: week.order
        });

        for (const day of week.days) {
          const dayId = `${week.key}::${day.order}`;
          dayRows.push({
            id: dayId,
            weekKey: week.key,
            title: day.title,
            order: day.order
          });

          for (const [index, exercise] of day.exercises.entries()) {
            const exerciseId = `${dayId}::${index + 1}`;
            exerciseRows.push({
              id: exerciseId,
              dayId,
              weekKey: week.key,
              order: index + 1,
              name: exercise.name,
              normalizedName: exercise.normalizedName,
              supersetGroup: exercise.supersetGroup,
              warmupSets: exercise.warmupSets,
              workingSets: exercise.workingSets,
              warmupSetsCount: exercise.warmupSetsCount,
              workingSetsCount: exercise.workingSetsCount,
              repsPlanned: exercise.repsPlanned,
              load: exercise.load,
              percentMin: exercise.percentMin,
              percentMax: exercise.percentMax,
              rpe: exercise.rpe,
              rest: exercise.rest,
              notes: exercise.notes,
              primaryLift: exercise.primaryLift
            });
          }
        }
      }

      await db.weeks.bulkPut(weekRows);
      await db.days.bulkPut(dayRows);
      await db.plannedExercises.bulkPut(exerciseRows);
    }

    const mergedSettings: Settings = {
      ...defaultSettings,
      ...existing,
      programVersion
    };

    if (!weeks.find((week) => week.key === mergedSettings.currentWeekKey)) {
      mergedSettings.currentWeekKey = weeks[0]?.key ?? null;
    }

    await db.settings.put(mergedSettings);
  });
}
