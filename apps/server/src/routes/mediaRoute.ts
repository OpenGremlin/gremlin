import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createLogger } from "@opengremlin/lib/logger.js";
import type { Request, Response } from "express";
import sharp from "sharp";
import { getS3Client } from "../gql/schema/FileUpload/s3.js";

const log = createLogger("media");

const MEDIA_ASSETS_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../../packages/media-server/assets",
);

const ALLOWED_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
type ImageFormat = (typeof ALLOWED_FORMATS)[number];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseImageParams(query: Record<string, unknown>) {
  const width =
    typeof query.width === "string"
      ? clamp(Number.parseInt(query.width, 10), 1, 3000)
      : undefined;
  const height =
    typeof query.height === "string"
      ? clamp(Number.parseInt(query.height, 10), 1, 3000)
      : undefined;
  const format =
    typeof query.format === "string" &&
    ALLOWED_FORMATS.includes(query.format as ImageFormat)
      ? (query.format as ImageFormat)
      : undefined;

  if (width !== undefined && Number.isNaN(width)) return null;
  if (height !== undefined && Number.isNaN(height)) return null;

  return { width, height, format };
}

async function processImage(
  inputBytes: Buffer,
  params: { width?: number; height?: number; format?: ImageFormat },
): Promise<{ buffer: Buffer; contentType: string }> {
  let pipeline = sharp(inputBytes);

  if (params.width || params.height) {
    pipeline = pipeline.resize({
      width: params.width,
      height: params.height,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const outputFormat = params.format ?? "webp";
  pipeline = pipeline.toFormat(outputFormat, { quality: 90 });

  return {
    buffer: await pipeline.toBuffer(),
    contentType: `image/${outputFormat}`,
  };
}

async function sendProcessed(
  res: Response,
  inputBytes: Buffer,
  key: string,
  params: { width?: number; height?: number; format?: ImageFormat },
): Promise<void> {
  const isSvg = key.endsWith(".svg");
  const wantsResize = params.width || params.height || params.format;

  if (isSvg && !wantsResize) {
    res
      .status(200)
      .set("Content-Type", "image/svg+xml")
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .send(inputBytes);
    return;
  }

  try {
    const { buffer, contentType } = await processImage(inputBytes, params);
    res
      .status(200)
      .set("Content-Type", contentType)
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .send(buffer);
  } catch (err) {
    log.error({ err, key }, "Failed to process image");
    res.status(500).send("Failed to process image");
  }
}

/**
 * GET /media/* — serves media assets from S3 (prod) or local disk (dev).
 * Supports optional resizing and format conversion via query params.
 */
export async function mediaRoute(req: Request, res: Response): Promise<void> {
  const key = req.params[0];
  if (!key) {
    res.status(400).send("Missing path");
    return;
  }

  const params = parseImageParams(req.query as Record<string, unknown>);
  if (!params) {
    res.status(400).send("Invalid parameters");
    return;
  }

  const bucket = process.env.MEDIA_BUCKET;

  if (!bucket) {
    // Dev mode — read from local assets directory
    const filePath = path.join(MEDIA_ASSETS_DIR, key);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(MEDIA_ASSETS_DIR)) {
      res.status(400).send("Invalid path");
      return;
    }

    try {
      let actualPath = resolved;
      try {
        await fs.access(actualPath);
      } catch {
        // Try with .svg extension (rasterized logo URLs omit it)
        actualPath = `${resolved}.svg`;
      }
      const inputBytes = await fs.readFile(actualPath);
      await sendProcessed(
        res,
        inputBytes,
        key.endsWith(".svg") ? key : `${key}.svg`,
        params,
      );
    } catch {
      res.status(404).send("Not found");
    }
    return;
  }

  // Try the key as-is, then with .svg appended (rasterized logo URLs omit the extension)
  const s3 = await getS3Client();
  const keysToTry = key.includes(".") ? [key] : [key, `${key}.svg`];

  for (const s3Key of keysToTry) {
    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: s3Key }),
      );
      const body = response.Body;
      if (!body) continue;

      const inputBytes = await streamToBuffer(body);
      await sendProcessed(res, inputBytes, s3Key, params);
      return;
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "NoSuchKey") continue;
      log.error({ err, key: s3Key }, "Failed to serve media asset");
      res.status(500).send("Internal error");
      return;
    }
  }

  res.status(404).send("Not found");
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
