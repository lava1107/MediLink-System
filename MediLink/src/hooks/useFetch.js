import { useEffect, useState, useCallback } from "react";

/**
 * Generic async-loader hook. Pass an async function (typically a service call);
 * it tracks loading/error/data state and re-runs whenever `deps` change.
 * Kept here so pages can move off in-memory context state onto real
 * `fetch`/`axios` calls to a backend with no change to component structure.
 */
export function useFetch(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    asyncFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { data, loading, error, refetch: run };
}
