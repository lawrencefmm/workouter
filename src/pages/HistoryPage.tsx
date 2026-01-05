import { useLiveQuery } from 'dexie-react-hooks';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatDateTime } from '../utils/format';

export function HistoryPage() {
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('startedAt').reverse().toArray(),
    []
  );

  if (!sessions) {
    return <div className="page">Loading history...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">History</p>
        <h1>Training Log</h1>
        <p className="subtle">Review past sessions and keep notes handy.</p>
      </header>

      <section className="day-list">
        {sessions.length === 0 && <div className="card">No sessions yet. Start a workout to log it.</div>}
        {sessions.map((session, index) => (
          <Link
            key={session.id}
            to={`/session/${session.id}`}
            className="card day-card reveal"
            style={{ '--i': index } as CSSProperties}
          >
            <div>
              <h2>{session.dayTitle}</h2>
              <p className="muted">{formatDateTime(session.startedAt)}</p>
              {session.notes && <p className="notes">{session.notes}</p>}
            </div>
            <span className={`pill ${session.endedAt ? 'pill--ready' : ''}`}>
              {session.endedAt ? 'Complete' : 'In Progress'}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
