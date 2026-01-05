import { useMemo, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { liftLabels } from '../types';
import { formatDateTime } from '../utils/format';
import { getPercentWeights } from '../utils/percent';

export function SessionPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const parsedSessionId = sessionId ? Number(sessionId) : null;
  const sessionIdNumber = parsedSessionId && !Number.isNaN(parsedSessionId) ? parsedSessionId : null;

  const session = useLiveQuery(
    () => (sessionIdNumber ? db.sessions.get(sessionIdNumber) : undefined),
    [sessionIdNumber]
  );

  const sets = useLiveQuery(
    () => (sessionIdNumber ? db.performedSets.where('sessionId').equals(sessionIdNumber).toArray() : []),
    [sessionIdNumber]
  );

  const dayId = session?.dayId ?? null;

  const exercises = useLiveQuery(
    () => (dayId ? db.plannedExercises.where('dayId').equals(dayId).sortBy('order') : []),
    [dayId]
  );

  const settings = useLiveQuery(() => db.settings.get('singleton'), []);
  const oneRepMaxes = useLiveQuery(() => db.oneRepMaxes.toArray(), []);

  const maxMap = useMemo(() => {
    const map = new Map<string, number>();
    (oneRepMaxes || []).forEach((entry) => map.set(entry.liftType, entry.valueKg));
    return map;
  }, [oneRepMaxes]);

  const groupedSets = useMemo(() => {
    const groups = new Map<string, typeof sets>();
    (sets || []).forEach((set) => {
      const list = groups.get(set.exerciseId) || [];
      list.push(set);
      groups.set(set.exerciseId, list);
    });
    for (const list of groups.values()) {
      list.sort((a, b) => a.setIndex - b.setIndex);
    }
    return groups;
  }, [sets]);

  const handleSetUpdate = async (setId: number, updates: { weightKg?: number | null; reps?: string }) => {
    await db.performedSets.update(setId, updates);
  };

  const handleWeightChange = async (setId: number, normalizedName: string, isWarmup: boolean, value: number | null) => {
    await handleSetUpdate(setId, { weightKg: value });
    if (!isWarmup && value !== null) {
      await db.exerciseLastUsed.put({ normalizedName, lastWeightKg: value, updatedAt: Date.now() });
    }
  };

  const applyWeightToExercise = async (exerciseId: string, normalizedName: string, weight: number) => {
    if (!sets) return;
    const updates = sets
      .filter((set) => set.exerciseId === exerciseId && !set.isWarmup)
      .map((set) => ({
        key: set.id,
        changes: { weightKg: weight }
      }));

    await db.transaction('rw', db.performedSets, db.exerciseLastUsed, async () => {
      await Promise.all(updates.map((update) => db.performedSets.update(update.key!, update.changes)));
      await db.exerciseLastUsed.put({ normalizedName, lastWeightKg: weight, updatedAt: Date.now() });
    });
  };

  const handleFinish = async () => {
    if (!sessionIdNumber) return;
    await db.sessions.update(sessionIdNumber, { endedAt: Date.now() });
    navigate('/history');
  };

  if (!session || !sets) {
    return <div className="page">Loading session...</div>;
  }

  const exerciseBlocks = exercises && exercises.length
    ? exercises.map((exercise) => ({ exercise, sets: groupedSets.get(exercise.id) || [] }))
    : Array.from(groupedSets.entries()).map(([exerciseId, setList]) => ({
        exercise: {
          id: exerciseId,
          dayId: session.dayId,
          weekKey: session.weekKey,
          order: 0,
          name: setList[0]?.exerciseName || 'Exercise',
          normalizedName: setList[0]?.normalizedName || '',
          supersetGroup: null,
          warmupSets: '',
          workingSets: '',
          warmupSetsCount: null,
          workingSetsCount: null,
          repsPlanned: '',
          load: '',
          percentMin: null,
          percentMax: null,
          rpe: '',
          rest: '',
          notes: '',
          primaryLift: null
        },
        sets: setList
      }));

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Workout Session</p>
        <h1>{session.dayTitle}</h1>
        <p className="subtle">Started {formatDateTime(session.startedAt)}</p>
      </header>

      <section className="session-controls">
        <label className="field">
          <span className="label">Session notes</span>
          <textarea
            value={session.notes}
            rows={3}
            onChange={(event) => db.sessions.update(session.id!, { notes: event.target.value })}
            placeholder="How did it feel?"
          />
        </label>
        <button className="secondary-button" onClick={handleFinish}>
          Finish Workout
        </button>
      </section>

      <section className="exercise-list">
        {exerciseBlocks.map(({ exercise, sets: setsForExercise }, index) => {
          const percentInfo =
            exercise.percentMin !== null &&
            exercise.percentMin !== undefined &&
            exercise.percentMax !== null &&
            exercise.percentMax !== undefined &&
            exercise.primaryLift &&
            settings &&
            maxMap.has(exercise.primaryLift)
              ? getPercentWeights({
                  oneRepMaxKg: maxMap.get(exercise.primaryLift) || 0,
                  percentMin: exercise.percentMin,
                  percentMax: exercise.percentMax,
                  roundingIncrementKg: settings.roundingIncrementKg,
                  recommendation: settings.percentRecommendation
                })
              : null;

          return (
            <div key={exercise.id} className="card exercise-card reveal" style={{ '--i': index } as CSSProperties}>
              <div className="exercise-card__header">
                <div>
                  <h2>{exercise.name}</h2>
                  <p className="muted">
                    {exercise.primaryLift ? `${liftLabels[exercise.primaryLift]} focus` : 'Accessory'}
                  </p>
                </div>
                {exercise.supersetGroup && <span className="pill">Superset {exercise.supersetGroup}</span>}
              </div>

              <div className="exercise-meta">
                <div>
                  <span className="label">Warmup</span>
                  <span>{exercise.warmupSets || '-'}</span>
                </div>
                <div>
                  <span className="label">Working</span>
                  <span>{exercise.workingSets || '-'}</span>
                </div>
                <div>
                  <span className="label">Reps</span>
                  <span>{exercise.repsPlanned || '-'}</span>
                </div>
                <div>
                  <span className="label">RPE</span>
                  <span>{exercise.rpe || '-'}</span>
                </div>
                <div>
                  <span className="label">Rest</span>
                  <span>{exercise.rest || '-'}</span>
                </div>
              </div>

              {percentInfo && (
                <div className="percent-actions">
                  <button
                    className="ghost-button"
                    onClick={() => applyWeightToExercise(exercise.id, exercise.normalizedName, percentInfo.minKg)}
                  >
                    Min {percentInfo.minKg} kg
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      applyWeightToExercise(exercise.id, exercise.normalizedName, percentInfo.recommendedKg)
                    }
                  >
                    Rec {percentInfo.recommendedKg} kg
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => applyWeightToExercise(exercise.id, exercise.normalizedName, percentInfo.maxKg)}
                  >
                    Max {percentInfo.maxKg} kg
                  </button>
                </div>
              )}

              <div className="set-table">
                {setsForExercise.map((set) => {
                  const warmupCount = exercise.warmupSetsCount ?? 0;
                  const displayIndex = set.isWarmup ? `W${set.setIndex}` : `${set.setIndex - warmupCount}`;
                  return (
                    <div key={set.id} className={`set-row ${set.isWarmup ? 'is-warmup' : ''}`}>
                      <span className="set-label">{displayIndex}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="input"
                      placeholder="kg"
                      value={set.weightKg ?? ''}
                      onChange={(event) =>
                        handleWeightChange(
                          set.id!,
                          set.normalizedName,
                          set.isWarmup,
                          event.target.value === '' ? null : Number(event.target.value)
                        )
                      }
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input"
                      placeholder={exercise.repsPlanned || 'reps'}
                      value={set.reps}
                      onChange={(event) => handleSetUpdate(set.id!, { reps: event.target.value })}
                    />
                  </div>
                  );
                })}
              </div>

              {exercise.notes && <p className="notes">{exercise.notes}</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
