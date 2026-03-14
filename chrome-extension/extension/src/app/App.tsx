import { useEffect, useState, type JSX } from "react";
import { LibraryApp } from "../library/App";
import { Sidebar, type AppRoute } from "./components/Sidebar";
import { MCPPage } from "./pages/MCPPage";
import { PlansPage } from "./pages/PlansPage";
import { SettingsPage } from "./pages/SettingsPage";

const ROUTES: AppRoute[] = ["library", "mcp", "plans", "settings"];
const DEFAULT_ROUTE: AppRoute = "library";

function parseHashRoute(hash: string): AppRoute {
  const segment = hash.replace(/^#\/?/, "").toLowerCase() || DEFAULT_ROUTE;
  if (ROUTES.includes(segment as AppRoute)) {
    return segment as AppRoute;
  }
  return DEFAULT_ROUTE;
}

function getRouteFromLocation(): AppRoute {
  return parseHashRoute(window.location.hash);
}

export function App(): JSX.Element {
  const [route, setRoute] = useState<AppRoute>(getRouteFromLocation);

  useEffect(() => {
    const parsed = parseHashRoute(window.location.hash);
    if (window.location.hash === "" || (parsed === DEFAULT_ROUTE && window.location.hash !== `#/${DEFAULT_ROUTE}`)) {
      window.location.replace(`#/${DEFAULT_ROUTE}`);
    }
  }, []);

  useEffect(() => {
    function onHashChange(): void {
      setRoute(getRouteFromLocation());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar currentRoute={route} />
      <main className="app-main" id="main-content">
        {route === "library" && <LibraryPage />}
        {route === "mcp" && <MCPPage />}
        {route === "plans" && <PlansPage />}
        {route === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

function LibraryPage(): JSX.Element {
  return <LibraryApp />;
}
