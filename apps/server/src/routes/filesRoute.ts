import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { createLogger } from "@opengremlin/lib/logger.js";
import { getSsmClient } from "@opengremlin/lib/services/sandbox/ssmClient.js";
import { mimeByExtension } from "@opengremlin/lib/services/workspace/mime.js";
import type { Request, Response } from "express";
import sharp from "sharp";

const log = createLogger("files");
const SKIP_AUTH = process.env.SKIP_AUTH === "true";

let cachedOriginSecret: string | undefined;
async function getOriginSecret(): Promise<string | undefined> {
  if (cachedOriginSecret) return cachedOriginSecret;
  try {
    const ssm = await getSsmClient();
    const res = await ssm.send(
      new GetParameterCommand({ Name: "/gremlin/origin-verify-secret" }),
    );
    cachedOriginSecret = res.Parameter?.Value ?? undefined;
  } catch {
    // SSM not available (local dev) — no secret to verify
  }
  return cachedOriginSecret;
}

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
  "image/svg+xml",
  "image/x-icon",
];

const ALLOWED_ORIGINS = new Set(
  [
    process.env.ADMIN_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8081",
  ].filter(Boolean),
);

function setCorsHeaders(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
}

/**
 * OPTIONS /api/files/:path — CORS preflight.
 */
export function filesCorsPreflight(req: Request, res: Response): void {
  setCorsHeaders(req, res);
  res.status(204).end();
}

/**
 * GET /api/files/:path — serves workspace files.
 * Auth is handled at the CloudFront edge (Lambda@Edge validates the bearer token).
 * Supports image resizing via ?width=N query param.
 */
export async function filesRoute(req: Request, res: Response): Promise<void> {
  setCorsHeaders(req, res);

  // Verify the request came through CloudFront (defense-in-depth).
  // In dev (SKIP_AUTH=true), skip since there is no CloudFront.
  if (!SKIP_AUTH) {
    const secret = await getOriginSecret();
    if (secret && req.headers["x-origin-verify"] !== secret) {
      res.status(403).set("Cache-Control", "no-store").send("Forbidden");
      return;
    }
  }

  const filePath = decodeURIComponent(req.params[0]);
  if (!filePath) {
    res.status(400).set("Cache-Control", "no-store").send("Missing path");
    return;
  }

  const { width } = req.query as Record<string, string | undefined>;

  // Path traversal guard
  const workspacePath = getWorkspacePath();
  const resolved = nodePath.resolve(workspacePath, filePath);
  if (!resolved.startsWith(workspacePath)) {
    res
      .status(403)
      .set("Cache-Control", "no-store")
      .send("Path traversal not allowed");
    return;
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      res.status(404).set("Cache-Control", "no-store").send("Not found");
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
      const fileSize = stat.size;
      const rangeHeader = req.headers.range;

      res.set("Content-Type", mime);
      res.set("Cache-Control", "public, max-age=3600");
      res.set("Accept-Ranges", "bytes");

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        let start: number;
        let end: number;
        if (match?.[1]) {
          start = Number.parseInt(match[1], 10);
          end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;
        } else {
          // Suffix range: bytes=-500 means last 500 bytes
          const suffix = match?.[2] ? Number.parseInt(match[2], 10) : fileSize;
          start = Math.max(0, fileSize - suffix);
          end = fileSize - 1;
        }

        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
          return;
        }

        res
          .status(206)
          .set("Content-Range", `bytes ${start}-${end}/${fileSize}`)
          .set("Content-Length", String(end - start + 1));

        const handle = await fs.open(resolved, "r");
        const readStream = handle.createReadStream({ start, end });
        readStream.pipe(res);
        readStream.on("error", () => {
          res.status(500).set("Cache-Control", "no-store").end();
        });
      } else {
        res.status(200).set("Content-Length", String(fileSize));
        const handle = await fs.open(resolved, "r");
        const readStream = handle.createReadStream();
        readStream.pipe(res);
        readStream.on("error", () => {
          res.status(500).set("Cache-Control", "no-store").end();
        });
      }
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      res.status(404).set("Cache-Control", "no-store").send("Not found");
      return;
    }
    log.error({ err, filePath }, "Failed to serve workspace file");
    res.status(500).set("Cache-Control", "no-store").send("Internal error");
  }
}
