import { useMemo, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { db } from '../db';
import { LiftType, liftLabels } from '../types';
import { formatDate } from '../utils/format';

const liftOptions: LiftType[] = ['SQUAT', 'BENCH', 'DEADLIFT', 'OHP'];

export function PRProgressPage() {
  const [selectedLift, setSelectedLift] = useState<LiftType>('SQUAT');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [valueKg, setValueKg] = useState('');
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');

  const prs = useLiveQuery(
    () => db.personalRecords.where('liftType').equals(selectedLift).sortBy('date'),
    [selectedLift]
  );

  const chartData = useMemo(() => {
    return (prs || []).map((pr) => ({
      date: pr.date,
      label: formatDate(pr.date),
      valueKg: pr.valueKg
    }));
  }, [prs]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!valueKg) return;
    const timestamp = new Date(date).getTime();
    await db.personalRecords.add({
      liftType: selectedLift,
      date: Number.isNaN(timestamp) ? Date.now() : timestamp,
      valueKg: Number(valueKg),
      reps: reps ? Number(reps) : null,
      notes: notes.trim() || undefined
    });
    setValueKg('');
    setReps('');
    setNotes('');
  };

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">PR Progress</p>
        <h1>Personal Records</h1>
        <p className="subtle">Track your top sets over time.</p>
      </header>

      <section className="card">
        <div className="field">
          <span className="label">Lift</span>
          <select value={selectedLift} onChange={(event) => setSelectedLift(event.target.value as LiftType)}>
            {liftOptions.map((lift) => (
              <option key={lift} value={lift}>
                {liftLabels[lift]}
              </option>
            ))}
          </select>
        </div>

        <div className="chart-wrapper">
          {chartData.length === 0 ? (
            <p className="muted">No PRs yet for {liftLabels[selectedLift]}.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} kg`, 'PR']} />
                <Line type="monotone" dataKey="valueKg" stroke="var(--accent)" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Add PR</h2>
        <form className="form-grid" onSubmit={handleAdd}>
          <label className="field">
            <span className="label">Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span className="label">Weight (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="180"
              value={valueKg}
              onChange={(event) => setValueKg(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="label">Reps (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="3"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
            />
          </label>
          <label className="field full">
            <span className="label">Notes (optional)</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </label>
          <button className="primary-button" type="submit">
            Save PR
          </button>
        </form>
      </section>

      <section className="card">
        <h2>History</h2>
        <div className="list">
          {(prs || []).length === 0 && <p className="muted">No PR entries yet.</p>}
          {(prs || []).map((pr) => (
            <div key={pr.id} className="list-row">
              <div>
                <strong>{pr.valueKg} kg</strong>
                {pr.reps ? <span className="muted"> · {pr.reps} reps</span> : null}
                {pr.notes ? <p className="muted">{pr.notes}</p> : null}
              </div>
              <span className="muted">{formatDate(pr.date)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
