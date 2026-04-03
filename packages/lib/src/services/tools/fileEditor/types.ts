/**
 * Shared types for the file editor tool suite.
 */

/** Snapshot recorded when a file is read, used for staleness detection. */
export interface FileReadState {
  content: string;
  timestamp: number;
  isPartialRead: boolean;
}
