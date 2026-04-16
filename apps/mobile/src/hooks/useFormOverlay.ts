import { useCallback, useMemo, useRef, useState } from "react";

type Overlay<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Manages nullable "overlay" fields on top of server data.
 * Each field is null when using the server value, non-null when locally edited.
 *
 * Provides: current merged values, an update function, isDirty, and discard.
 */
export function useFormOverlay<T extends Record<string, unknown>>(
  serverValues: T,
) {
  // Keep serverValues in a ref so update/dirtyFields callbacks stay stable
  const serverRef = useRef(serverValues);
  serverRef.current = serverValues;

  const [overlay, setOverlay] = useState<Overlay<T>>(() => {
    const init = {} as Overlay<T>;
    for (const k of Object.keys(serverValues) as (keyof T)[]) init[k] = null;
    return init;
  });

  const current = useMemo(() => {
    const merged = {} as T;
    for (const k of Object.keys(serverValues) as (keyof T)[]) {
      merged[k] = (overlay[k] ?? serverValues[k]) as T[typeof k];
    }
    return merged;
  }, [overlay, serverValues]);

  const isDirty = useMemo(
    () => Object.values(overlay).some((v) => v !== null),
    [overlay],
  );

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setOverlay((prev) => ({
      ...prev,
      [key]: value === serverRef.current[key] ? null : value,
    }));
  }, []);

  const discard = useCallback(() => {
    setOverlay((prev) => {
      const reset = {} as Overlay<T>;
      for (const k of Object.keys(prev) as (keyof T)[]) reset[k] = null;
      return reset;
    });
  }, []);

  const dirtyFields = useCallback(() => {
    const fields = {} as Partial<T>;
    for (const k of Object.keys(overlay) as (keyof T)[]) {
      if (overlay[k] !== null) fields[k] = overlay[k] as T[typeof k];
    }
    return fields;
  }, [overlay]);

  return { current, isDirty, update, discard, dirtyFields };
}
