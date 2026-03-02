export type Patch = { old_text: string; new_text: string };

export function applyPatches(body: string, patches: Patch[]): string {
  let result = body;
  for (const patch of patches) {
    const idx = result.indexOf(patch.old_text);
    if (idx === -1)
      throw new Error(
        `Patch target not found: "${patch.old_text.slice(0, 50)}..."`,
      );
    result =
      result.slice(0, idx) +
      patch.new_text +
      result.slice(idx + patch.old_text.length);
  }
  return result;
}
