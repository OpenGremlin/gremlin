export function buildMediaUrl(
  cdnBase: string,
  path: string,
  width?: number | null,
): string {
  const widthParam = width ? `?width=${width}` : "";
  return `${cdnBase}${path}${widthParam}`;
}
