import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createLogger } from "@gremlin/lib/logger.js";
import type { Request, Response } from "express";
import sharp from "sharp";
import { getS3Client } from "../gql/schema/FileUpload/s3.js";

const log = createLogger("media");

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
  const quality =
    typeof query.quality === "string"
      ? clamp(Number.parseInt(query.quality, 10), 1, 100)
      : 80;
  const format =
    typeof query.format === "string"
      ? (query.format as ImageFormat)
      : undefined;

  if (width !== undefined && Number.isNaN(width)) return null;
  if (height !== undefined && Number.isNaN(height)) return null;
  if (format && !ALLOWED_FORMATS.includes(format)) return null;

  return { width, height, quality, format };
}

function inferFormat(contentType: string | undefined): ImageFormat {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("avif")) return "avif";
  return "jpeg";
}

async function processImage(
  inputBytes: Buffer,
  params: {
    width?: number;
    height?: number;
    quality: number;
    format?: ImageFormat;
  },
  contentType?: string,
): Promise<{ buffer: Buffer; format: ImageFormat }> {
  let pipeline = sharp(inputBytes);

  if (params.width || params.height) {
    pipeline = pipeline.resize({
      width: params.width,
      height: params.height,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const outputFormat = params.format ?? inferFormat(contentType);
  pipeline = pipeline.toFormat(outputFormat, { quality: params.quality });

  return { buffer: await pipeline.toBuffer(), format: outputFormat };
}

/**
 * GET /media/* — serves media assets from S3 (prod) or local assets dir (dev).
 * Replaces the old Lambda-based media resizer.
 */
export async function mediaRoute(req: Request, res: Response): Promise<void> {
  const key = req.params[0];
  if (!key) {
    res.status(400).send("Missing path");
    return;
  }

  const bucket = process.env.MEDIA_BUCKET;

  if (!bucket) {
    // Dev mode — assets are served via express.static in index.ts
    res.status(404).send("Not found");
    return;
  }

  const params = parseImageParams(req.query as Record<string, unknown>);
  if (!params) {
    res.status(400).send("Invalid parameters");
    return;
  }

  try {
    const response = await (await getS3Client()).send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = response.Body;
    if (!body) {
      res.status(404).send("Not found");
      return;
    }

    const inputBytes = await streamToBuffer(body);
    const isImage = response.ContentType?.startsWith("image/");

    if (isImage && (params.width || params.height || params.format)) {
      const result = await processImage(
        inputBytes,
        params,
        response.ContentType,
      );
      res
        .status(200)
        .set("Content-Type", `image/${result.format}`)
        .set("Cache-Control", "public, max-age=31536000, immutable")
        .send(result.buffer);
    } else {
      res
        .status(200)
        .set("Content-Type", response.ContentType ?? "application/octet-stream")
        .set("Cache-Control", "public, max-age=31536000, immutable")
        .send(inputBytes);
    }
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") {
      res.status(404).send("Not found");
      return;
    }
    log.error({ err, key }, "Failed to serve media asset");
    res.status(500).send("Internal error");
  }
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
