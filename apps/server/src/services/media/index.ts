export function buildMediaUrl(
  cdnBase: string,
  path: string,
  width?: number | null,
): string {
  const base = cdnBase.endsWith("/") ? cdnBase : `${cdnBase}/`;
  const widthParam = width ? `?width=${width}` : "";
  return `${base}${path}${widthParam}`;
}

export const mediaService = { buildMediaUrl };

export type MediaService = typeof mediaService;
