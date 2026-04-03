import * as fs from "node:fs";
import type { FileReadState } from "./types.js";

/**
 * Tracks file read state so that write/edit operations can detect
 * stale reads and enforce read-before-write discipline.
 *
 * Create one instance per agent invocation and share it across
 * the readFile, writeFile, and editFile tools.
 */
export class FileStateTracker {
  private state = new Map<string, FileReadState>();

  /** Record that a file was read at this point in time. */
  recordRead(
    absolutePath: string,
    content: string,
    isPartialRead: boolean,
  ): void {
    this.state.set(absolutePath, {
      content,
      timestamp: getModificationTime(absolutePath),
      isPartialRead,
    });
  }

  /**
   * Validate that a file is safe to write/edit:
   * 1. It must have been read first (unless it doesn't exist yet).
   * 2. It must not have been modified on disk since the last read.
   * 3. The read must have been a full read (no offset/limit).
   *
   * @throws If any check fails.
   */
  validateForWrite(absolutePath: string, fileExists: boolean): void {
    const entry = this.state.get(absolutePath);

    if (!entry) {
      if (fileExists) {
        throw new Error(
          "File has not been read yet. Use the readFile tool before editing or writing.",
        );
      }
      // New file — no prior read required.
      return;
    }

    if (entry.isPartialRead) {
      throw new Error(
        "File was only partially read (with offset/limit). Read the full file before editing.",
      );
    }

    if (fileExists) {
      const currentMtime = getModificationTime(absolutePath);
      if (currentMtime > entry.timestamp) {
        throw new Error(
          "File has been modified since it was last read. Re-read the file and try again.",
        );
      }
    }
  }

  /** Clear tracked state for a path (e.g. after a successful write). */
  clear(absolutePath: string): void {
    this.state.delete(absolutePath);
  }
}

/** Get file modification time in ms (floored to integer). */
function getModificationTime(absolutePath: string): number {
  try {
    return Math.floor(fs.statSync(absolutePath).mtimeMs);
  } catch {
    return 0;
  }
}
