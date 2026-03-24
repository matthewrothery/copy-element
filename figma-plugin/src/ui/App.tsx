import { useEffect } from "react";
import { ElementList } from "./components/ElementList";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth } from "./hooks/useAuth";
import { useCaptures } from "./hooks/useCaptures";
import { buildFigmaTree } from "./utils/htmlToFigmaTree";
import type { CaptureItem } from "./types";
import type { FigmaNodeSpec } from "./utils/htmlToFigmaTree";

function sendBuildFrame(spec: FigmaNodeSpec) {
  parent.postMessage(
    { pluginMessage: { type: "BUILD_FRAME", payload: { spec } } },
    "*"
  );
}

export function App() {
  const { status: authStatus, token, initiateAuth, cancelAuth, signOut } = useAuth();
  const { filtered, query, setQuery, loading, error, refetch } = useCaptures(token);

  useEffect(() => {
    if (authStatus === "authenticated" && token) {
      refetch();
    }
  }, [authStatus, token, refetch]);

  async function handleInsert(capture: CaptureItem) {
    if (!capture.htmlUrl) {
      parent.postMessage(
        { pluginMessage: { type: "NOTIFY", message: "No HTML available for this capture." } },
        "*"
      );
      return;
    }
    parent.postMessage(
      { pluginMessage: { type: "NOTIFY", message: "Building frame…" } },
      "*"
    );
    try {
      const res = await fetch(capture.htmlUrl);
      if (!res.ok) throw new Error("Failed to fetch HTML");
      const htmlContent = await res.text();
      const spec = buildFigmaTree(htmlContent, capture.width, capture.height);
      spec.name = capture.title;
      sendBuildFrame(spec);
    } catch {
      parent.postMessage(
        { pluginMessage: { type: "NOTIFY", message: "Failed to build frame from capture." } },
        "*"
      );
    }
  }

  if (authStatus === "loading") {
    return <p className="empty-state">Loading…</p>;
  }

  if (authStatus === "idle" || authStatus === "polling") {
    return <AuthScreen status={authStatus} onSignIn={initiateAuth} onCancel={cancelAuth} />;
  }

  return (
    <>
      <header className="plugin-header">
        <h1 className="plugin-header-title">Element Armory</h1>
        <button
          className="plugin-header-signout"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
        >
          Sign out
        </button>
      </header>
      <div className="plugin-search-row">
        <input
          type="search"
          className="plugin-search"
          placeholder="Search captures..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search captures"
        />
      </div>
      <main className="plugin-main">
        {loading && <p className="empty-state">Loading captures…</p>}
        {error && (
          <p className="empty-state" role="alert">
            {error.message}
          </p>
        )}
        {!loading && !error && (
          <ElementList
            elements={filtered}
            onInsert={handleInsert}
            onPreview={() => undefined}
          />
        )}
      </main>
    </>
  );
}
