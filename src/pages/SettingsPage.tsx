import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LiftType, liftLabels, PercentRecommendation, Theme } from '../types';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { downloadBlob, toCsv } from '../utils/export';

const liftOptions: LiftType[] = ['SQUAT', 'BENCH', 'DEADLIFT', 'OHP'];
const roundingOptions: Array<1.25 | 2.5 | 5> = [1.25, 2.5, 5];

export function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('singleton'), []);
  const oneRepMaxes = useLiveQuery(() => db.oneRepMaxes.toArray(), []);
  const { online, offlineReady } = useOfflineStatus();

  const maxMap = new Map(oneRepMaxes?.map((entry) => [entry.liftType, entry.valueKg]));

  const handleThemeChange = async (theme: Theme) => {
    await db.settings.update('singleton', { theme });
  };

  const handleRoundingChange = async (roundingIncrementKg: 1.25 | 2.5 | 5) => {
    await db.settings.update('singleton', { roundingIncrementKg });
  };

  const handleRecommendationChange = async (percentRecommendation: PercentRecommendation) => {
    await db.settings.update('singleton', { percentRecommendation });
  };

  const handleMaxChange = async (liftType: LiftType, value: string) => {
    const valueKg = Number(value);
    if (!value) {
      await db.oneRepMaxes.delete(liftType);
      return;
    }
    await db.oneRepMaxes.put({ liftType, valueKg, updatedAt: Date.now() });
  };

  const exportJson = async () => {
    const data = {
      settings: await db.settings.toArray(),
      oneRepMaxes: await db.oneRepMaxes.toArray(),
      weeks: await db.weeks.toArray(),
      days: await db.days.toArray(),
      plannedExercises: await db.plannedExercises.toArray(),
      sessions: await db.sessions.toArray(),
      performedSets: await db.performedSets.toArray(),
      exerciseLastUsed: await db.exerciseLastUsed.toArray(),
      personalRecords: await db.personalRecords.toArray()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'workouter-export.json');
  };

  const exportSessionsCsv = async () => {
    const sessions = await db.sessions.toArray();
    const sets = await db.performedSets.toArray();

    const sessionMap = new Map(sessions.map((session) => [session.id, session]));

    const rows = [
      [
        'sessionId',
        'startedAt',
        'endedAt',
        'weekKey',
        'dayTitle',
        'sessionNotes',
        'exerciseName',
        'setIndex',
        'weightKg',
        'reps',
        'isWarmup'
      ]
    ];

    sets.forEach((set) => {
      const session = sessionMap.get(set.sessionId);
      rows.push([
        set.sessionId,
        session ? new Date(session.startedAt).toISOString() : '',
        session?.endedAt ? new Date(session.endedAt).toISOString() : '',
        session?.weekKey || '',
        session?.dayTitle || '',
        session?.notes || '',
        set.exerciseName,
        set.setIndex,
        set.weightKg ?? '',
        set.reps,
        set.isWarmup ? 'yes' : 'no'
      ]);
    });

    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    downloadBlob(blob, 'workouter-sessions.csv');
  };

  const exportPrsCsv = async () => {
    const prs = await db.personalRecords.toArray();
    const rows = [['liftType', 'date', 'valueKg', 'reps', 'notes']];
    prs.forEach((pr) => {
      rows.push([
        pr.liftType,
        new Date(pr.date).toISOString(),
        pr.valueKg,
        pr.reps ?? '',
        pr.notes ?? ''
      ]);
    });
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    downloadBlob(blob, 'workouter-prs.csv');
  };

  if (!settings) {
    return <div className="page">Loading settings...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>Preferences</h1>
        <p className="subtle">Tune your 1RMs, rounding, and exports.</p>
      </header>

      <section className="card">
        <h2>Theme</h2>
        <div className="segmented">
          {(['system', 'light', 'dark'] as Theme[]).map((theme) => (
            <button
              key={theme}
              className={`segmented__button ${settings.theme === theme ? 'is-active' : ''}`}
              onClick={() => handleThemeChange(theme)}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>1RM Settings</h2>
        <div className="form-grid">
          {liftOptions.map((lift) => (
            <label key={lift} className="field">
              <span className="label">{liftLabels[lift]}</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={maxMap.get(lift) ?? ''}
                onChange={(event) => handleMaxChange(lift, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>%1RM Rounding</h2>
        <div className="field">
          <span className="label">Rounding Increment</span>
          <select
            value={settings.roundingIncrementKg}
            onChange={(event) => handleRoundingChange(Number(event.target.value) as 1.25 | 2.5 | 5)}
          >
            {roundingOptions.map((value) => (
              <option key={value} value={value}>
                {value} kg
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="label">Recommendation</span>
          <select
            value={settings.percentRecommendation}
            onChange={(event) => handleRecommendationChange(event.target.value as PercentRecommendation)}
          >
            <option value="min">Use min</option>
            <option value="mid">Use midpoint</option>
            <option value="max">Use max</option>
          </select>
        </div>
      </section>

      <section className="card">
        <h2>Offline</h2>
        <div className="offline-status">
          <span className={`status-dot ${offlineReady ? 'is-ready' : ''}`}></span>
          <div>
            <p>{offlineReady ? 'Offline ready' : 'Setting up offline mode...'}</p>
            <p className="muted">{online ? 'Online' : 'Offline'}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Export</h2>
        <div className="button-row">
          <button className="secondary-button" onClick={exportJson}>
            Export JSON
          </button>
          <button className="secondary-button" onClick={exportSessionsCsv}>
            Sessions CSV
          </button>
          <button className="secondary-button" onClick={exportPrsCsv}>
            PRs CSV
          </button>
        </div>
      </section>
    </div>
  );
}
