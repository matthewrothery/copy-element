import './Sidebar.css';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '▦' },
  { to: '/funnel', label: 'Funnel', icon: '⫸' },
  { to: '/conversion', label: 'Conversion', icon: '⇥' },
  { to: '/usage', label: 'Usage', icon: '◈' },
  { to: '/installs', label: 'Installs', icon: '⬇' },
  { to: '/retention', label: 'Retention', icon: '↩' },
  { to: '/analytics', label: 'Analytics', icon: '⊙' },
  { to: '/errors', label: 'Errors', icon: '⚡' },
  { to: '/users', label: 'Users', icon: '⊞' },
  { to: '/revenue', label: 'Revenue', icon: '$' },
  { to: '/complimentary', label: 'Complimentary', icon: '✦' },
  { to: '/blog', label: 'Blog', icon: '✎' },
] as const;

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps): React.ReactElement {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo">EA</span>
        <span className="sidebar__brand-name">Admin</span>
      </div>
      <ul className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onNavClick}
            >
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
