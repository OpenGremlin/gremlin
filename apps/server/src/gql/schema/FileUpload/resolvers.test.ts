import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";

// S3 client commands are `new`-constructed, so the mocks must be classes (not arrow fns).
// Instances stash their input so tests can assert on the built command shape.
const putObjectInstances: { input: unknown }[] = [];

class MockPutObjectCommand {
  constructor(public input: unknown) {
    putObjectInstances.push(this);
  }
}

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {},
  PutObjectCommand: MockPutObjectCommand,
}));

const getSignedUrlMock = vi.fn();
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

vi.mock("./s3.js", () => ({
  getS3Client: async () => ({ send: vi.fn() }),
  getUploadsBucketName: () => "test-uploads-bucket",
}));

vi.mock("../../../shared/workspacePath.js", () => ({
  getWorkspacePath: () => "/tmp/test-workspace",
}));

const fsStatMock = vi.fn();
vi.mock("node:fs/promises", async () => {
  const actual =
    await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
  return { ...actual, stat: fsStatMock };
});

const { fileUploadResolvers } = await import("./resolvers.js");

describe("FileUpload resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putObjectInstances.length = 0;
  });

  describe("requestFileUploads", () => {
    it("generates a presigned URL per file with a namespaced S3 key", async () => {
      getSignedUrlMock
        .mockResolvedValueOnce("https://s3.example/presigned-1")
        .mockResolvedValueOnce("https://s3.example/presigned-2");

      const ctx = buildTestContext();
      const result = await invokeResolver(
        fileUploadResolvers.Mutation.requestFileUploads,
        {
          args: {
            agentId: "agent-1",
            taskId: "task-1",
            files: [
              { filename: "a.txt", contentType: "text/plain", sizeBytes: 10 },
              { filename: "b.png", contentType: "image/png", sizeBytes: 20 },
            ],
          },
          ctx,
        },
      );

      expect(result).toHaveLength(2);
      expect(result[0].presignedUrl).toBe("https://s3.example/presigned-1");
      expect(result[0].key).toMatch(/^agent-1\/task-1\/[0-9a-f-]+\/a\.txt$/);
      expect(result[1].presignedUrl).toBe("https://s3.example/presigned-2");
      expect(result[1].key).toMatch(/^agent-1\/task-1\/[0-9a-f-]+\/b\.png$/);

      expect(putObjectInstances[0]?.input).toMatchObject({
        Bucket: "test-uploads-bucket",
        ContentType: "text/plain",
        ContentLength: 10,
      });
      expect(putObjectInstances[1]?.input).toMatchObject({
        Bucket: "test-uploads-bucket",
        ContentType: "image/png",
        ContentLength: 20,
      });
    });

    it("uses 'main' as the folder when taskId is absent", async () => {
      getSignedUrlMock.mockResolvedValueOnce("https://s3.example/presigned");

      const ctx = buildTestContext();
      const result = await invokeResolver(
        fileUploadResolvers.Mutation.requestFileUploads,
        {
          args: {
            agentId: "agent-1",
            taskId: null,
            files: [
              {
                filename: "note.md",
                contentType: "text/markdown",
                sizeBytes: 5,
              },
            ],
          },
          ctx,
        },
      );

      expect(result[0].key).toMatch(/^agent-1\/main\/[0-9a-f-]+\/note\.md$/);
    });
  });

  describe("attachFileReference", () => {
    it("writes a file_upload SYSTEM log when the workspace file exists", async () => {
      fsStatMock.mockResolvedValue({
        isFile: () => true,
        size: 123,
      });

      const ctx = buildTestContext();
      ctx.services.orchestrator.writeAgentLog = vi
        .fn()
        .mockResolvedValue(undefined);

      const result = await invokeResolver(
        fileUploadResolvers.Mutation.attachFileReference,
        {
          args: {
            input: {
              agentId: "agent-1",
              taskId: null,
              filePath: "docs/spec.md",
            },
          },
          ctx,
        },
      );

      expect(result).toBe(true);
      expect(ctx.services.orchestrator.writeAgentLog).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          agentId: "agent-1",
          taskId: null,
          role: "SYSTEM",
          attachments: [{ type: "file", path: "docs/spec.md" }],
        }),
      );
      const logCall = (
        ctx.services.orchestrator.writeAgentLog as unknown as {
          mock: { calls: [unknown, { content: string }][] };
        }
      ).mock.calls[0];
      const payload = JSON.parse(logCall[1].content);
      expect(payload).toEqual({
        type: "file_upload",
        filename: "spec.md",
        path: "docs/spec.md",
        sizeBytes: 123,
      });
    });
  });
});
