import { useMemo, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { startSession } from '../services/sessions';
import { liftLabels } from '../types';
import { getPercentWeights } from '../utils/percent';

export function DayDetailPage() {
  const navigate = useNavigate();
  const { dayId } = useParams();
  const decodedDayId = dayId ? decodeURIComponent(dayId) : null;
  const day = useLiveQuery(() => (decodedDayId ? db.days.get(decodedDayId) : undefined), [decodedDayId]);
  const exercises = useLiveQuery(
    () => (decodedDayId ? db.plannedExercises.where('dayId').equals(decodedDayId).sortBy('order') : []),
    [decodedDayId]
  );
  const settings = useLiveQuery(() => db.settings.get('singleton'), []);
  const oneRepMaxes = useLiveQuery(() => db.oneRepMaxes.toArray(), []);

  const maxMap = useMemo(() => {
    const map = new Map<string, number>();
    (oneRepMaxes || []).forEach((entry) => map.set(entry.liftType, entry.valueKg));
    return map;
  }, [oneRepMaxes]);

  const handleStart = async () => {
    if (!day || !exercises || !settings || !oneRepMaxes) return;
    const sessionId = await startSession({ day, exercises, settings, oneRepMaxes });
    navigate(`/session/${sessionId}`);
  };

  if (!day || !exercises) {
    return <div className="page">Loading day...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{day.weekKey}</p>
        <h1>{day.title}</h1>
        <p className="subtle">Warmups, working sets, and your %1RM targets.</p>
      </header>

      <button className="primary-button" onClick={handleStart}>
        Start Workout
      </button>

      <section className="exercise-list">
        {exercises.map((exercise, index) => {
          const percentInfo =
            exercise.percentMin !== null &&
            exercise.percentMax !== null &&
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
                <div className="percent-box">
                  <div>
                    <span className="label">%1RM</span>
                    <strong>
                      {exercise.percentMin}%{exercise.percentMax !== exercise.percentMin ? `-${exercise.percentMax}%` : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="label">Range</span>
                    <strong>
                      {percentInfo.minKg} - {percentInfo.maxKg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="label">Recommended</span>
                    <strong>{percentInfo.recommendedKg} kg</strong>
                  </div>
                </div>
              )}

              {exercise.notes && <p className="notes">{exercise.notes}</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
