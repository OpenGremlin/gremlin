// Drawing drafts are not supported on web (expo-file-system Directory/File are native-only).

export function saveDraft(_agentId: string, _pngBase64: string): void {}

export function loadDraft(_agentId: string): string | null {
  return null;
}

export function deleteDraft(_agentId: string): void {}

export function hasDraft(_agentId: string): boolean {
  return false;
}
