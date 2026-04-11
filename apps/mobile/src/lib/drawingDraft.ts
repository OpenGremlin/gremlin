import { Directory, File, Paths } from "expo-file-system";

function getDraftFile(agentId: string): File {
  const dir = new Directory(Paths.cache, "drawing-drafts");
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return new File(dir, `draft_${agentId}.png`);
}

export function saveDraft(agentId: string, pngBase64: string): void {
  const file = getDraftFile(agentId);
  if (file.exists) file.delete();
  file.create();
  file.write(pngBase64, { encoding: "base64" });
}

export function loadDraft(agentId: string): string | null {
  const file = getDraftFile(agentId);
  if (!file.exists || (file.size ?? 0) === 0) return null;
  return file.uri;
}

export function deleteDraft(agentId: string): void {
  const file = getDraftFile(agentId);
  if (file.exists) file.delete();
}

export function hasDraft(agentId: string): boolean {
  const file = getDraftFile(agentId);
  return file.exists && (file.size ?? 0) > 0;
}
