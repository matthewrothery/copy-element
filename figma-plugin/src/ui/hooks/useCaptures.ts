import { useCallback, useMemo, useState } from "react";
import { fetchCaptures } from "../api";
import type { CaptureItem } from "../types";

export function useCaptures(token: string | null): {
  captures: CaptureItem[];
  filtered: CaptureItem[];
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCaptures(token);
      setCaptures(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load captures"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return captures;
    return captures.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.sourceUrl?.toLowerCase().includes(q) ?? false)
    );
  }, [captures, query]);

  return { captures, filtered, query, setQuery, loading, error, refetch };
}
