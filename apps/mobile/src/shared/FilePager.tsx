import { router } from "expo-router";
import { openSheet } from "../lib/sheetStore";
import type { FileNode } from "./FilePreview";

export type {
  FilePagerSheetPayload,
  PagerFileEntry,
} from "../../app/sheet/file-pager";

/**
 * Open the FilePager sheet route. Replaces the old <FilePager visible>
 * JSX with a single function call from the consumer.
 */
export function presentFilePager(payload: {
  files: FileNode[] | Array<{ path: string; name: string }>;
  initialIndex: number;
}): void {
  const sheetId = openSheet(payload);
  router.push(`/sheet/file-pager?id=${sheetId}`);
}
