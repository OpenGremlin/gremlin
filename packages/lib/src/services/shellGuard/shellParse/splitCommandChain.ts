import { isDoubleQuoteEscape } from "./escapes.js";

/**
 * Split a command string by chain operators while respecting quotes and escapes.
 * Returns null if no chain operators are present.
 */
export function splitCommandChain(command: string): string[] | null {
  const parts: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let foundChain = false;

  const pushPart = (): boolean => {
    const trimmed = buf.trim();
    buf = "";
    if (!trimmed) return false;
    parts.push(trimmed);
    return true;
  };

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    const next = command[i + 1];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "\\") {
      escaped = true;
      buf += ch;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      buf += ch;
      continue;
    }
    if (inDouble) {
      if (ch === "\\" && isDoubleQuoteEscape(next)) {
        buf += ch;
        buf += next;
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      buf += ch;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      buf += ch;
      continue;
    }

    // Check for comment
    if (ch === "#" && (i === 0 || /\s/.test(command[i - 1] ?? ""))) {
      break;
    }

    if (ch === "&" && next === "&") {
      if (!pushPart()) return null; // empty segment before &&
      i += 1;
      foundChain = true;
      continue;
    }
    if (ch === "|" && next === "|") {
      if (!pushPart()) return null;
      i += 1;
      foundChain = true;
      continue;
    }
    if (ch === ";") {
      if (!pushPart()) return null;
      foundChain = true;
      continue;
    }

    buf += ch;
  }

  if (!foundChain) return null;
  const trimmed = buf.trim();
  if (!trimmed) return null;
  parts.push(trimmed);
  return parts.length > 0 ? parts : null;
}
