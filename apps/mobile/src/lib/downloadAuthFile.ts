import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

/**
 * Download a (possibly auth-protected) remote URL to the app cache directory
 * and return a local `File` whose `uri` is suitable for expo-sharing /
 * expo-print.
 *
 * The result is cached on disk by URL hash, so repeat calls for the same URL
 * are effectively free. Pass `force: true` to bypass the cache.
 */
export async function downloadAuthFile(
  url: string,
  {
    token,
    filename,
    force = false,
  }: { token?: string | null; filename: string; force?: boolean },
): Promise<File> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    url,
  );
  const dir = new Directory(Paths.cache, "file-preview", hash);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const target = new File(dir, filename);
  if (!force && target.exists && (target.size ?? 0) > 0) {
    return target;
  }
  if (target.exists) {
    target.delete();
  }

  return await File.downloadFileAsync(url, target, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
