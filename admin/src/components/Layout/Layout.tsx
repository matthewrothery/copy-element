import './Layout.css';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Topbar } from '@/components/Topbar/Topbar';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/funnel': 'Funnel',
  '/conversion': 'Conversion',
  '/usage': 'Usage',
  '/retention': 'Retention',
  '/analytics': 'Analytics',
  '/errors': 'Errors',
  '/users': 'Users',
  '/revenue': 'Revenue',
  '/complimentary': 'Complimentary Access',
  '/blog': 'Blog Generator',
};

export function Layout(): React.ReactElement {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <div className="layout">
      {sidebarOpen && (
        <div className="layout__overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <Sidebar
        onNavClick={() => setSidebarOpen(false)}
      />
      {/* Mobile sidebar */}
      <div className={`layout__mobile-sidebar ${sidebarOpen ? 'layout__mobile-sidebar--open' : ''}`}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>
      <div className="layout__main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen((v) => !v)} />
        <div className="layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
