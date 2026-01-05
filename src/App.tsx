import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { seedProgramIfNeeded } from './seed';
import { db } from './db';
import { BottomNav } from './components/BottomNav';
import { ProgramPage } from './pages/ProgramPage';
import { DayDetailPage } from './pages/DayDetailPage';
import { SessionPage } from './pages/SessionPage';
import { HistoryPage } from './pages/HistoryPage';
import { PRProgressPage } from './pages/PRProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [ready, setReady] = useState(false);
  const settings = useLiveQuery(() => db.settings.get('singleton'), []);

  useEffect(() => {
    seedProgramIfNeeded().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!settings) return;
    document.body.dataset.theme = settings.theme;
  }, [settings]);

  if (!ready) {
    return (
      <div className="splash">
        <div>
          <p className="eyebrow">Workouter</p>
          <h1>Loading program...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/program" replace />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/program/week/:weekKey/day/:dayId" element={<DayDetailPage />} />
          <Route path="/session/:sessionId" element={<SessionPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/pr-progress" element={<PRProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
