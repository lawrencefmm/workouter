/// <reference types="vitest/globals" />
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { seedProgramIfNeeded } from '../seed';
import { db } from '../db';
import { ProgramPage } from '../pages/ProgramPage';
import { DayDetailPage } from '../pages/DayDetailPage';
import { SessionPage } from '../pages/SessionPage';
import { startSession } from '../services/sessions';

async function setupProgram() {
  await seedProgramIfNeeded();
  const day = await db.days.orderBy('order').first();
  if (!day) throw new Error('No day found');
  const exercises = await db.plannedExercises.where('dayId').equals(day.id).sortBy('order');
  const settings = await db.settings.get('singleton');
  if (!settings) throw new Error('No settings found');
  return { day, exercises, settings };
}

afterEach(async () => {
  await db.delete();
  await db.open();
});

describe('Workouter UI', () => {
  it('renders program week tabs and day list', async () => {
    await seedProgramIfNeeded();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/program']}>
          <Routes>
            <Route path="/program" element={<ProgramPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Week 1' })).toBeInTheDocument();
    expect(await screen.findByText('Full Body 1: Squat, OHP')).toBeInTheDocument();
  });

  it('marks the active week tab with aria-selected', async () => {
    await seedProgramIfNeeded();

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/program']}>
          <Routes>
            <Route path="/program" element={<ProgramPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const tabList = await screen.findByRole('tablist', { name: 'Weeks' });
    expect(tabList).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab', { name: /Week 1/i });
    const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(activeTab).toBeDefined();
  });

  it('shows latest session summary on day detail', async () => {
    const { day, exercises, settings } = await setupProgram();
    const sessionId = await startSession({ day, exercises, settings, oneRepMaxes: [] });

    const firstSet = await db.performedSets.where('sessionId').equals(sessionId).first();
    await db.performedSets.update(firstSet!.id!, { weightKg: 100, reps: '5' });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/program/week/${day.weekKey}/day/${encodeURIComponent(day.id)}`]}>
          <Routes>
            <Route path="/program/week/:weekKey/day/:dayId" element={<DayDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText('Latest Session')).toBeInTheDocument();
    expect(await screen.findByText(exercises[0].name)).toBeInTheDocument();
  });

  it('navigates between exercises during a session', async () => {
    const { day, exercises, settings } = await setupProgram();
    if (exercises.length < 2) {
      throw new Error('Expected at least two exercises for navigation test.');
    }
    const sessionId = await startSession({ day, exercises, settings, oneRepMaxes: [] });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
          <Routes>
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText(exercises[0].name)).toBeInTheDocument();

    const user = userEvent.setup();
    const nextButton = await screen.findByRole('button', { name: 'Next' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(exercises[1].name)).toBeInTheDocument();
    });
  });
});
