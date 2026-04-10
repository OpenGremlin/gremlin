import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@opengremlin/lib/logger.js";
import type { APIGatewayProxyResultV2 } from "aws-lambda";
import sharp from "sharp";

const log = createLogger("media-resize");
const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME ?? "";

const ALLOWED_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
type ImageFormat = (typeof ALLOWED_FORMATS)[number];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseParams(query: Record<string, string | undefined>) {
  const width = query.width
    ? clamp(parseInt(query.width, 10), 1, 3000)
    : undefined;
  const height = query.height
    ? clamp(parseInt(query.height, 10), 1, 3000)
    : undefined;
  const quality = query.quality
    ? clamp(parseInt(query.quality, 10), 1, 100)
    : 80;
  const format = query.format as ImageFormat | undefined;

  if (width !== undefined && Number.isNaN(width)) return null;
  if (height !== undefined && Number.isNaN(height)) return null;
  if (format && !ALLOWED_FORMATS.includes(format)) return null;

  return { width, height, quality, format };
}

export async function handler(event: {
  rawPath: string;
  queryStringParameters?: Record<string, string | undefined>;
}): Promise<APIGatewayProxyResultV2> {
  const key = decodeURIComponent(event.rawPath.replace(/^\//, ""));

  if (!key) {
    return { statusCode: 400, body: "Missing image path" };
  }

  const params = parseParams(event.queryStringParameters ?? {});
  if (!params) {
    return { statusCode: 400, body: "Invalid parameters" };
  }

  let originalBody: ReadableStream | Blob | Buffer | Uint8Array | undefined;
  let contentType: string | undefined;

  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    originalBody = response.Body as unknown as Buffer | undefined;
    contentType = response.ContentType;

    if (!originalBody) {
      return { statusCode: 404, body: "Image not found" };
    }
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "NoSuchKey") {
      return { statusCode: 404, body: "Image not found" };
    }
    log.error({ err, key }, "Failed to fetch image from S3");
    return { statusCode: 500, body: "Failed to fetch image" };
  }

  try {
    const inputBytes = await streamToBuffer(originalBody);
    const isSvg = contentType?.includes("svg") || key.endsWith(".svg");
    const wantsResize = params.width || params.height || params.format;

    if (isSvg && !wantsResize) {
      // Serve SVG directly without rasterization
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: inputBytes.toString("utf-8"),
        isBase64Encoded: false,
      };
    }

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

    const outputBuffer = await pipeline.toBuffer();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": `image/${outputFormat}`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: outputBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    log.error({ err, key }, "Failed to process image");
    return { statusCode: 500, body: "Failed to process image" };
  }
}

function inferFormat(contentType: string | undefined): ImageFormat {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("avif")) return "avif";
  return "jpeg";
}

async function streamToBuffer(
  body: ReadableStream | Blob | Buffer | Uint8Array | unknown,
): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);

  // SDK v3 returns a Readable stream in Node.js
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
