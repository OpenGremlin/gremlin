import { router } from "expo-router";
import type { ReactNode } from "react";
import { openSheet } from "../lib/sheetStore";

export interface PickerOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Extra text to match against when searching (not displayed) */
  searchTerms?: string;
}

/** Payload type stored in sheetStore for the generic picker sheet route. */
export interface PickerSheetPayload {
  title: string;
  options: PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}

/**
 * Open the generic picker sheet route with the given options. The
 * onSelect callback is invoked from inside the picker when the user
 * taps a row, and the route pops itself afterwards.
 *
 * Replaces the old `<PickerModal visible={...}>` JSX pattern.
 */
export function presentPicker(payload: PickerSheetPayload): void {
  const sheetId = openSheet<PickerSheetPayload>(payload);
  router.push(`/sheet/picker?id=${sheetId}`);
}
