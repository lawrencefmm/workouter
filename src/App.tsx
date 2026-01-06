import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { seedProgramIfNeeded } from './seed';
import { db } from './db';
import { BottomNav } from './components/BottomNav';

const ProgramPage = lazy(() => import('./pages/ProgramPage').then((m) => ({ default: m.ProgramPage })));
const DayDetailPage = lazy(() => import('./pages/DayDetailPage').then((m) => ({ default: m.DayDetailPage })));
const SessionPage = lazy(() => import('./pages/SessionPage').then((m) => ({ default: m.SessionPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const PRProgressPage = lazy(() => import('./pages/PRProgressPage').then((m) => ({ default: m.PRProgressPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

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
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="page">Loading view...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/program" replace />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/program/week/:weekKey/day/:dayId" element={<DayDetailPage />} />
            <Route path="/session/:sessionId" element={<SessionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/pr-progress" element={<PRProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
