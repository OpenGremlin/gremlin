import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { createLogger } from "@gremlin/lib/logger.js";
import { verifyFileSignature } from "@gremlin/lib/services/workspace/buildFileUrl.js";
import { mimeByExtension } from "@gremlin/lib/services/workspace/mime.js";
import type { Request, Response } from "express";
import sharp from "sharp";

const log = createLogger("files");

function getWorkspacePath() {
  return nodePath.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

const IMAGE_MIME_PREFIXES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/svg+xml",
  "image/x-icon",
];

/**
 * GET /api/files/:path — serves workspace files with HMAC signature verification.
 * Supports image resizing via ?width=N query param.
 */
export async function filesRoute(req: Request, res: Response): Promise<void> {
  const filePath = decodeURIComponent(req.params[0]);
  if (!filePath) {
    res.status(400).send("Missing path");
    return;
  }

  const { expires, sig, width } = req.query as Record<
    string,
    string | undefined
  >;

  // In dev (SKIP_AUTH=true), allow unsigned requests
  const skipAuth = process.env.SKIP_AUTH === "true";
  if (!skipAuth) {
    if (!expires || !sig) {
      res.status(403).send("Missing signature");
      return;
    }
    if (!verifyFileSignature(filePath, expires, sig)) {
      res.status(403).send("Invalid or expired signature");
      return;
    }
  }

  // Path traversal guard
  const workspacePath = getWorkspacePath();
  const resolved = nodePath.resolve(workspacePath, filePath);
  if (!resolved.startsWith(workspacePath)) {
    res.status(403).send("Path traversal not allowed");
    return;
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      res.status(404).send("Not found");
      return;
    }

    const ext = nodePath.extname(resolved);
    const mime = mimeByExtension(ext) ?? "application/octet-stream";
    const isResizableImage = IMAGE_MIME_PREFIXES.some((p) =>
      mime.startsWith(p),
    );
    const requestedWidth = width ? Number.parseInt(width, 10) : undefined;

    if (isResizableImage && requestedWidth && requestedWidth > 0) {
      const inputBytes = await fs.readFile(resolved);
      const buffer = await sharp(inputBytes)
        .resize({
          width: Math.min(requestedWidth, 3000),
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toBuffer();

      res
        .status(200)
        .set("Content-Type", "image/webp")
        .set("Cache-Control", "public, max-age=3600")
        .send(buffer);
    } else {
      res
        .status(200)
        .set("Content-Type", mime)
        .set("Cache-Control", "public, max-age=3600");
      const stream = await fs.open(resolved, "r");
      const readStream = stream.createReadStream();
      readStream.pipe(res);
      readStream.on("error", () => {
        res.status(500).end();
      });
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      res.status(404).send("Not found");
      return;
    }
    log.error({ err, filePath }, "Failed to serve workspace file");
    res.status(500).send("Internal error");
  }
}
