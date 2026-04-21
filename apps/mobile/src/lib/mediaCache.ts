import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

interface CacheEntry {
  uri: string;
  size: number;
  refCount: number;
  lastAccess: number;
  hash: string;
  ext: string;
}

interface AcquireOptions {
  token?: string | null;
  ext: string;
}

export interface MediaHandle {
  uri: string;
  release: () => void;
}

const CACHE_DIR_NAME = "media-cache";
const MAX_CACHE_BYTES = 200 * 1024 * 1024;

const entries = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

function cacheDir(): Directory {
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function cacheFile(hash: string, ext: string): File {
  return new File(cacheDir(), `${hash}.${ext}`);
}

async function load(url: string, opts: AcquireOptions): Promise<CacheEntry> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    url,
  );
  const file = cacheFile(hash, opts.ext);

  let ready: File;
  if (file.exists && (file.size ?? 0) > 0) {
    ready = file;
  } else {
    if (file.exists) file.delete();
    ready = await File.downloadFileAsync(url, file, {
      headers: opts.token
        ? { Authorization: `Bearer ${opts.token}` }
        : undefined,
    });
  }

  const entry: CacheEntry = {
    uri: ready.uri,
    size: ready.size ?? 0,
    refCount: 0,
    lastAccess: Date.now(),
    hash,
    ext: opts.ext,
  };
  entries.set(url, entry);
  return entry;
}

/**
 * Acquire a cached local copy of a remote media URL. The returned `release`
 * must be called exactly once when the consumer is done. Files are deleted
 * only when they are idle (refCount == 0) and the cache is over budget, so
 * the local file is guaranteed to outlive any native player that is still
 * holding a handle to it.
 */
export async function acquireMedia(
  url: string,
  opts: AcquireOptions,
): Promise<MediaHandle> {
  let entry = entries.get(url);
  if (!entry) {
    let promise = inflight.get(url);
    if (!promise) {
      promise = load(url, opts).finally(() => {
        inflight.delete(url);
      });
      inflight.set(url, promise);
    }
    entry = await promise;
  }

  entry.refCount++;
  entry.lastAccess = Date.now();

  const acquired = entry;
  let released = false;
  return {
    uri: acquired.uri,
    release: () => {
      if (released) return;
      released = true;
      acquired.refCount = Math.max(0, acquired.refCount - 1);
      acquired.lastAccess = Date.now();
      evictIfNeeded();
    },
  };
}

function evictIfNeeded(): void {
  let total = 0;
  for (const e of entries.values()) total += e.size;
  if (total <= MAX_CACHE_BYTES) return;

  const idle = [...entries.entries()]
    .filter(([, e]) => e.refCount === 0)
    .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

  for (const [url, entry] of idle) {
    if (total <= MAX_CACHE_BYTES) break;
    try {
      cacheFile(entry.hash, entry.ext).delete();
    } catch {
      // best-effort; OS may reclaim the cache dir independently
    }
    entries.delete(url);
    total -= entry.size;
  }
}
