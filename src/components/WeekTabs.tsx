import { Week } from '../db';

type Props = {
  weeks: Week[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

export function WeekTabs({ weeks, selectedKey, onSelect }: Props) {
  return (
    <div className="week-tabs" role="tablist" aria-label="Weeks">
      {weeks.map((week) => (
        <button
          key={week.key}
          className={`week-tab ${selectedKey === week.key ? 'is-active' : ''}`}
          onClick={() => onSelect(week.key)}
          aria-current={selectedKey === week.key ? 'page' : undefined}
          aria-pressed={selectedKey === week.key}
          role="tab"
          aria-selected={selectedKey === week.key}
        >
          {week.title}
          {selectedKey === week.key ? <span className="sr-only"> (current)</span> : null}
        </button>
      ))}
    </div>
  );
}
