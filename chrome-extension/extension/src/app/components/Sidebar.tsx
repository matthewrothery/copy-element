import { BookMarked, CreditCard, Plug, Settings } from "lucide-react";
import type { JSX } from "react";

export type AppRoute = "library" | "mcp" | "plans" | "settings";

const NAV_ITEMS: { route: AppRoute; label: string; icon: typeof BookMarked }[] = [
  { route: "library", label: "Library", icon: BookMarked },
  { route: "mcp", label: "MCP", icon: Plug },
  { route: "plans", label: "Plans & Pricing", icon: CreditCard },
  { route: "settings", label: "Settings", icon: Settings }
];

interface SidebarProps {
  currentRoute: AppRoute;
}

function getHashForRoute(route: AppRoute): string {
  return `#/${route}`;
}

export function Sidebar({ currentRoute }: SidebarProps): JSX.Element {
  return (
    <aside className="app-sidebar" aria-label="App navigation">
      <div className="app-sidebar-brand">
        <span className="app-sidebar-title">Element Armory</span>
      </div>
      <nav className="app-sidebar-nav">
        <ul className="app-sidebar-list" role="list">
          {NAV_ITEMS.map(({ route, label, icon: Icon }) => {
            const isActive = currentRoute === route;
            return (
              <li key={route}>
                <a
                  href={getHashForRoute(route)}
                  className={`app-sidebar-link ${isActive ? "app-sidebar-link-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} aria-hidden />
                  <span>{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
