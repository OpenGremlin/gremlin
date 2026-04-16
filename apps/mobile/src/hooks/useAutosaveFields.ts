import { useCallback, useEffect, useRef, useState } from "react";

export type Fields = {
  name: string;
  personality: string;
  role: string;
  delegationHint: string;
};

const EMPTY: Fields = {
  name: "",
  personality: "",
  role: "",
  delegationHint: "",
};
const KEYS = Object.keys(EMPTY) as (keyof Fields)[];
const DEBOUNCE_MS = 600;

function trimFields(f: Fields): Fields {
  return {
    name: f.name.trim(),
    personality: f.personality.trim(),
    role: f.role.trim(),
    delegationHint: f.delegationHint.trim(),
  };
}

function fieldsEqual(a: Fields, b: Fields) {
  return KEYS.every((k) => a[k] === b[k]);
}

/**
 * Manages debounced autosave for agent text fields.
 *
 * - Dirty tracking prevents server responses from clobbering in-flight edits.
 * - No-op detection skips the save when trimmed values match the server state.
 * - Flushes pending edits on unmount so the last keystrokes aren't lost.
 */
export function useAutosaveFields(save: (fields: Fields) => Promise<unknown>) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [role, setRole] = useState("");
  const [delegationHint, setDelegationHint] = useState("");

  const fieldsRef = useRef<Fields>(EMPTY);
  fieldsRef.current = { name, personality, role, delegationHint };

  const dirtyRef = useRef(false);
  const serverRef = useRef<Fields>(EMPTY);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(() => {
    debounceRef.current = null;
    const trimmed = trimFields(fieldsRef.current);
    if (fieldsEqual(trimmed, serverRef.current)) {
      dirtyRef.current = false;
      return;
    }
    save(trimmed).finally(() => {
      if (!debounceRef.current) dirtyRef.current = false;
    });
  }, [save]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushSave, DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (dirtyRef.current) flushSave();
      }
    };
  }, [flushSave]);

  const update = useCallback(
    (field: keyof Fields, value: string) => {
      dirtyRef.current = true;
      fieldsRef.current = { ...fieldsRef.current, [field]: value };
      const s = {
        name: setName,
        personality: setPersonality,
        role: setRole,
        delegationHint: setDelegationHint,
      };
      s[field](value);
      scheduleSave();
    },
    [scheduleSave],
  );

  /** Sync from server data. Skipped when dirty to avoid clobbering local edits. */
  const syncFromServer = useCallback((server: Fields) => {
    serverRef.current = server;
    if (!dirtyRef.current) {
      fieldsRef.current = server;
      setName(server.name);
      setPersonality(server.personality);
      setRole(server.role);
      setDelegationHint(server.delegationHint);
    }
  }, []);

  return { name, personality, role, delegationHint, update, syncFromServer };
}
