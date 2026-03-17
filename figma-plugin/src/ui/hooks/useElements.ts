import { useCallback, useMemo, useState } from "react";
import { fetchElements } from "../api";
import type { ElementItem } from "../types";

export function useElements(): {
  elements: ElementItem[];
  filtered: ElementItem[];
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchElements();
      setElements(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load elements"));
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return elements;
    return elements.filter(
      (el) =>
        el.name.toLowerCase().includes(q) ||
        (el.sourceUrl?.toLowerCase().includes(q) ?? false)
    );
  }, [elements, query]);

  return { elements, filtered, query, setQuery, loading, error, refetch };
}
