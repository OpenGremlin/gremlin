import { getFileInfo } from "@opengremlin/lib/services/workspace/getFileInfo.js";

/**
 * Shared helper for AgentLog and Task `files` resolvers.
 * Maps file paths to file-info objects with the server base URL attached.
 */
export async function resolveFiles(
  filePaths: string[] | undefined,
  serverBaseUrl: string,
) {
  const paths = filePaths ?? [];
  if (paths.length === 0) return [];
  const results = await Promise.all(
    paths.map(async (filePath: string) => {
      try {
        const info = await getFileInfo(filePath);
        if (!info) return null;
        return { ...info, _serverBase: serverBaseUrl };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((f): f is NonNullable<typeof f> => f != null);
}
