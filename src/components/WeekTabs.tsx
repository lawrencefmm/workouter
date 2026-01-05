import { Week } from '../db';

type Props = {
  weeks: Week[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

export function WeekTabs({ weeks, selectedKey, onSelect }: Props) {
  return (
    <div className="week-tabs">
      {weeks.map((week) => (
        <button
          key={week.key}
          className={`week-tab ${selectedKey === week.key ? 'is-active' : ''}`}
          onClick={() => onSelect(week.key)}
        >
          {week.title}
        </button>
      ))}
    </div>
  );
}
