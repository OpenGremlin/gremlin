export type CommandSegment = {
  /** The raw text of this pipeline segment. */
  raw: string;
  /** Parsed argv tokens. */
  argv: string[];
  /** The resolved executable name (basename, wrappers stripped). */
  executable: string | null;
};

export type CommandAnalysis = {
  ok: boolean;
  reason?: string;
  /** All segments across all chains and pipelines. */
  segments: CommandSegment[];
};

export type ChainOperator = "&&" | "||" | ";";
