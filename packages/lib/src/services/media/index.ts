export function buildMediaUrl(
  cdnBase: string,
  path: string,
  width?: number | null,
): string {
  const url = new URL(path, cdnBase.endsWith("/") ? cdnBase : `${cdnBase}/`);
  if (width) url.searchParams.set("width", String(width));
  return url.toString();
}

export const mediaService = { buildMediaUrl };

export type MediaService = typeof mediaService;
