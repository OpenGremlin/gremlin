const preloaded = new Set<string>();

export function preloadImages(urls: string[]) {
  for (const url of urls) {
    if (preloaded.has(url)) continue;
    preloaded.add(url);
    const img = new Image();
    img.src = url;
  }
}
