import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  /** Poll interval in ms. Pauses automatically when the screen unmounts. */
  refreshMs?: number;
  enabled?: boolean;
}

/**
 * Minimal data hook: loading / error / data, pull-to-refresh and optional polling.
 * `error` is a human message; `refetch` never throws.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: Options = {}) {
  const { refreshMs, enabled = true } = opts;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (mode: "initial" | "pull" | "silent") => {
    if (mode === "initial") setLoading(true);
    if (mode === "pull") setRefreshing(true);
    try {
      const r = await fnRef.current();
      if (!alive.current) return;
      setData(r);
      setError(null);
    } catch (e: any) {
      if (!alive.current) return;
      // Silent polls keep stale data on screen rather than flashing an error.
      if (mode !== "silent" || data === undefined) setError(e?.message ?? "Something went wrong");
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    alive.current = true;
    if (enabled) void run("initial");
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!refreshMs || !enabled) return;
    const t = setInterval(() => void run("silent"), refreshMs);
    return () => clearInterval(t);
  }, [refreshMs, enabled, run]);

  return {
    data,
    error,
    loading,
    refreshing,
    refetch: () => run("silent"),
    pull: () => run("pull"),
    setData,
  };
}
