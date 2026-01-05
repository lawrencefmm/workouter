import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { WeekTabs } from '../components/WeekTabs';

export function ProgramPage() {
  const weeks = useLiveQuery(() => db.weeks.orderBy('order').toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('singleton'), []);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => {
    if (!weeks || weeks.length === 0) return;
    if (settings?.currentWeekKey) {
      setSelectedWeek(settings.currentWeekKey);
      return;
    }
    if (!selectedWeek) {
      setSelectedWeek(weeks[0].key);
    }
  }, [weeks, settings, selectedWeek]);

  const days = useLiveQuery(
    () => (selectedWeek ? db.days.where('weekKey').equals(selectedWeek).sortBy('order') : []),
    [selectedWeek]
  );

  const weekTitle = useMemo(() => {
    if (!weeks || !selectedWeek) return 'Program';
    const match = weeks.find((week) => week.key === selectedWeek);
    return match ? match.title : 'Program';
  }, [weeks, selectedWeek]);

  const handleSelect = async (key: string) => {
    setSelectedWeek(key);
    await db.settings.update('singleton', { currentWeekKey: key });
  };

  if (!weeks) {
    return <div className="page">Loading program...</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Program</p>
        <h1>{weekTitle}</h1>
        <p className="subtle">Tap a day to start logging your session.</p>
      </header>

      <WeekTabs weeks={weeks} selectedKey={selectedWeek} onSelect={handleSelect} />

      <section className="day-list">
        {days?.map((day, index) => (
          <Link
            key={day.id}
            to={`/program/week/${day.weekKey}/day/${encodeURIComponent(day.id)}`}
            className="card day-card reveal"
            style={{ '--i': index } as CSSProperties}
          >
            <div>
              <h2>{day.title}</h2>
              <p className="muted">Week {day.weekKey}</p>
            </div>
            <span className="pill">Open</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
