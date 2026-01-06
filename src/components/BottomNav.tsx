import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/program',
    label: 'Program',
    icon: (
      <path
        d="M5 6h14v12H5z M8 3h8v3H8z M8 18h8"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <path
        d="M7 7h10v10H7z M7 3h10M12 10v5M12 10h3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  },
  {
    to: '/pr-progress',
    label: 'PR Progress',
    icon: (
      <path
        d="M5 16l4-4 3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <path
        d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4h-2.1a6.8 6.8 0 00-.6-1.5l1.5-1.5-1.4-1.4-1.5 1.5a6.8 6.8 0 00-1.5-.6V4h-2v2.1a6.8 6.8 0 00-1.5.6L9.4 5.2 8 6.6l1.5 1.5a6.8 6.8 0 00-.6 1.5H6v2h2.1a6.8 6.8 0 00.6 1.5L7.2 15l1.4 1.4 1.5-1.5a6.8 6.8 0 001.5.6V18h2v-2.1a6.8 6.8 0 001.5-.6l1.5 1.5 1.4-1.4-1.5-1.5a6.8 6.8 0 00.6-1.5H20z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
