/** A glob pattern that matches allowed executables. */
export interface AllowlistEntry {
  pattern: string;
}

/** Persistence provider for allow/deny lists. */
export interface AllowlistProvider {
  getEntries(agentId: string): Promise<AllowlistEntry[]>;
  addEntry(agentId: string, entry: AllowlistEntry): Promise<void>;
  removeEntry(agentId: string, pattern: string): Promise<void>;
}
