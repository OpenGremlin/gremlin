import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getWorkspacePath } from "../../../shared/workspacePath.js";
import type { GremlinContext } from "../../context.js";
import { getS3Client, getUploadsBucketName } from "./s3.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/** Strip path separators and limit length for safe filesystem use. */
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\]/g, "_").replace(/\0/g, "").slice(0, 255);
}

/**
 * Given a directory and a filename, return a unique path by appending
 * -1, -2, etc. before the extension when a collision exists.
 */
async function uniqueUploadPath(
  dir: string,
  filename: string,
): Promise<string> {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  let i = 1;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${base}-${i}${ext}`);
      i++;
    } catch {
      return candidate;
    }
  }
}

const requestFileUploads = async (
  _parent: unknown,
  args: {
    agentId: string;
    taskId?: string | null;
    files: Array<{ filename: string; contentType: string; sizeBytes: number }>;
  },
  ctx: GremlinContext,
) => {
  if (!ctx.user) throw new Error("Unauthorized");

  const { S3Client: _S3, PutObjectCommand } = await import(
    "@aws-sdk/client-s3"
  );
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const s3 = await getS3Client();
  const bucket = getUploadsBucketName();

  const results = [];
  for (const file of args.files) {
    if (file.sizeBytes > MAX_FILE_SIZE) {
      throw new Error(`File "${file.filename}" exceeds maximum size of 100 MB`);
    }

    const sanitized = sanitizeFilename(file.filename);
    if (!sanitized) {
      throw new Error(`Invalid filename: "${file.filename}"`);
    }

    const uploadId = crypto.randomUUID();
    const folder = args.taskId ?? "main";
    const key = `${args.agentId}/${folder}/${uploadId}/${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: file.contentType,
      ContentLength: file.sizeBytes,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    results.push({ uploadId, presignedUrl, key });
  }

  ctx.log.info(
    { agentId: args.agentId, fileCount: args.files.length },
    "Generated presigned upload URLs",
  );

  return results;
};

const completeFileUpload = async (
  _parent: unknown,
  {
    input,
  }: {
    input: {
      agentId: string;
      taskId?: string | null;
      key: string;
      filename: string;
      contentType: string;
      sizeBytes: number;
    };
  },
  ctx: GremlinContext,
) => {
  if (!ctx.user) throw new Error("Unauthorized");

  const { HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } =
    await import("@aws-sdk/client-s3");
  const s3 = await getS3Client();
  const bucket = getUploadsBucketName();

  // Verify the file exists in S3
  await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: input.key }));

  // Determine EFS destination
  const workspace = getWorkspacePath();
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const uploadsDir = path.join(workspace, "uploads", dateStr);
  await fs.mkdir(uploadsDir, { recursive: true });

  const sanitized = sanitizeFilename(input.filename);
  const destPath = await uniqueUploadPath(uploadsDir, sanitized);
  const relativePath = path.relative(workspace, destPath);
  const finalFilename = path.basename(destPath);

  // Download from S3 and write to EFS
  const getRes = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: input.key }),
  );

  const bodyBytes = await getRes.Body?.transformToByteArray();
  if (!bodyBytes) throw new Error("Empty response from S3");
  await fs.writeFile(destPath, bodyBytes);

  // Delete from S3
  await s3
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: input.key }))
    .catch((err: unknown) =>
      ctx.log.warn(
        { err, key: input.key },
        "Failed to delete S3 upload object",
      ),
    );

  // Write agent log entry directly so the subscription fires immediately
  // (going through the inbox consumer would delay it until SQS processes)
  const content = JSON.stringify({
    type: "file_upload",
    filename: finalFilename,
    path: `/workspace/${relativePath}`,
    sizeBytes: input.sizeBytes,
    contentType: input.contentType,
  });

  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId: input.agentId,
    taskId: input.taskId ?? null,
    role: "SYSTEM",
    content,
    attachments: [{ type: "file", path: relativePath }],
  });

  ctx.log.info(
    {
      agentId: input.agentId,
      filename: finalFilename,
      path: relativePath,
    },
    "File upload completed",
  );

  return {
    path: relativePath,
    filename: finalFilename,
    sizeBytes: input.sizeBytes,
    contentType: input.contentType,
  };
};

const attachFileReference = async (
  _parent: unknown,
  {
    input,
  }: {
    input: {
      agentId: string;
      taskId?: string | null;
      filePaths: string[];
    };
  },
  ctx: GremlinContext,
) => {
  if (!ctx.user) throw new Error("Unauthorized");

  if (input.filePaths.length === 0) {
    throw new Error("filePaths cannot be empty");
  }

  const workspace = getWorkspacePath();

  const files = await Promise.all(
    input.filePaths.map(async (raw) => {
      // Normalise: accept both "/workspace/foo" and "foo" forms
      const relativePath = raw.startsWith("/workspace/")
        ? raw.slice("/workspace/".length)
        : raw;
      const absPath = path.resolve(workspace, relativePath);

      // Guard against path traversal
      if (!absPath.startsWith(workspace + path.sep) && absPath !== workspace) {
        throw new Error(`Invalid path: ${raw}`);
      }

      const stat = await fs.stat(absPath).catch(() => null);
      if (!stat) throw new Error(`Not found: ${relativePath}`);

      return {
        filename: path.basename(absPath),
        path: relativePath,
        isDirectory: stat.isDirectory(),
        sizeBytes: stat.isFile() ? stat.size : undefined,
      };
    }),
  );

  const content = JSON.stringify({
    type: "file_upload",
    files,
  });

  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId: input.agentId,
    taskId: input.taskId ?? null,
    role: "SYSTEM",
    content,
    attachments: files.map((f) => ({ type: "file", path: f.path })),
  });

  ctx.log.info(
    { agentId: input.agentId, paths: files.map((f) => f.path) },
    "File reference attached",
  );

  return true;
};

export const fileUploadResolvers = {
  Mutation: { requestFileUploads, completeFileUpload, attachFileReference },
};
