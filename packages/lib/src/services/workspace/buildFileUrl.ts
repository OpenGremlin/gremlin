export function buildWorkspaceFileUrl(
  serverBase: string,
  filePath: string,
  options?: { width?: number | null },
): string {
  const base = serverBase.replace(/\/$/, "");
  const url = new URL(`/api/files/${encodeURIComponent(filePath)}`, base);
  if (options?.width) url.searchParams.set("width", String(options.width));
  return url.toString();
}
