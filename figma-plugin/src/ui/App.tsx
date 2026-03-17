import { useEffect } from "react";
import { ElementList } from "./components/ElementList";
import { useElements } from "./hooks/useElements";

function sendInsert(element: { id: string; name: string }) {
  parent.postMessage(
    { pluginMessage: { type: "INSERT_ELEMENT", payload: { name: element.name } } },
    "*"
  );
}

export function App() {
  const { filtered, query, setQuery, loading, error, refetch } = useElements();

  useEffect(() => {
    refetch();
  }, [refetch]);

  function handlePreview(_element: { id: string; name: string }) {
    // Placeholder: open preview modal when API is ready
  }

  return (
    <>
      <header className="plugin-header">
        <h1 className="plugin-header-title">Element Armory</h1>
        <input
          type="search"
          className="plugin-search"
          placeholder="Search components..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search components"
        />
      </header>
      <main className="plugin-main">
        {loading && <p className="empty-state">Loading...</p>}
        {error && (
          <p className="empty-state" role="alert">
            {error.message}
          </p>
        )}
        {!loading && !error && (
          <ElementList
            elements={filtered}
            onInsert={sendInsert}
            onPreview={handlePreview}
          />
        )}
      </main>
    </>
  );
}
