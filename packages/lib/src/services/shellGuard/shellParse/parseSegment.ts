import { splitShellArgs } from "./splitShellArgs.js";
import type { CommandSegment } from "./types.js";
import { unwrapToExecutable } from "./unwrapToExecutable.js";

export function parseSegment(raw: string): CommandSegment {
  const argv = splitShellArgs(raw);
  if (!argv || argv.length === 0) {
    return { raw, argv: [], executable: null };
  }
  const { executable } = unwrapToExecutable(argv);
  return { raw, argv, executable };
}
