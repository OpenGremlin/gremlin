import { useCallback, useMemo, useState } from "react";
import { haptics } from "../lib/haptics";

export interface FileSelectionState {
  /** Currently in multi-select mode */
  isSelectionMode: boolean;
  /** Set of selected entry paths */
  selectedPaths: Set<string>;
  /** Number of selected items */
  count: number;
  /** Enter selection mode with an initial item (long-press trigger) */
  enterSelectionMode: (path: string) => void;
  /** Toggle an item's selection (tap in selection mode) */
  toggleItem: (path: string) => void;
  /** Select all items from a list of paths */
  selectAll: (allPaths: string[]) => void;
  /** Exit selection mode and clear everything */
  clearSelection: () => void;
}

export function useFileSelection(): FileSelectionState {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const enterSelectionMode = useCallback((path: string) => {
    haptics.medium();
    setIsSelectionMode(true);
    setSelectedPaths(new Set([path]));
  }, []);

  const toggleItem = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      // If nothing left selected, exit selection mode
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((allPaths: string[]) => {
    setSelectedPaths(new Set(allPaths));
  }, []);

  const clearSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedPaths(new Set());
  }, []);

  return useMemo(
    () => ({
      isSelectionMode,
      selectedPaths,
      count: selectedPaths.size,
      enterSelectionMode,
      toggleItem,
      selectAll,
      clearSelection,
    }),
    [
      isSelectionMode,
      selectedPaths,
      enterSelectionMode,
      toggleItem,
      selectAll,
      clearSelection,
    ],
  );
}
