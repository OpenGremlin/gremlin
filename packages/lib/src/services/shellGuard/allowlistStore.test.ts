import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { createAllowlistStore } from "./allowlistStore.js";

describe("createAllowlistStore", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();
    mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
    vi.clearAllMocks();
  });

  describe("getEntries", () => {
    it("queries by agent-specific partition key", async () => {
      mockDocSend.mockResolvedValue({ Items: [] });
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      await store.getEntries("agent-42");

      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.ExpressionAttributeValues[":pk"]).toBe(
        "SHELL_GUARD_ALLOWLIST#agent-42",
      );
    });

    it("maps DynamoDB items to AllowlistEntry[]", async () => {
      mockDocSend.mockResolvedValue({
        Items: [{ pattern: "docker" }, { pattern: "npm" }],
      });
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      const entries = await store.getEntries("agent-1");

      expect(entries).toEqual([{ pattern: "docker" }, { pattern: "npm" }]);
    });

    it("returns empty array when no items", async () => {
      mockDocSend.mockResolvedValue({ Items: undefined });
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      const entries = await store.getEntries("agent-1");

      expect(entries).toEqual([]);
    });
  });

  describe("addEntry", () => {
    it("lowercases the pattern in pk and item", async () => {
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      await store.addEntry("agent-1", { pattern: "Docker" });

      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.Item.sk).toBe("PATTERN#docker");
      expect(cmd.input.Item.pattern).toBe("docker");
    });

    it("writes correct partition key and entity type", async () => {
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      await store.addEntry("agent-99", { pattern: "cargo" });

      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.Item.pk).toBe("SHELL_GUARD_ALLOWLIST#agent-99");
      expect(cmd.input.Item._et).toBe("ShellGuardAllowlist");
      expect(cmd.input.Item.agentId).toBe("agent-99");
    });
  });

  describe("removeEntry", () => {
    it("lowercases the pattern in delete key", async () => {
      ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
        send: mockDocSend,
      } as any);
      ctx.resources.ddb.table.getName.mockReturnValue("test-table");

      const store = createAllowlistStore(ctx);
      await store.removeEntry("agent-1", "Docker");

      expect(mockDocSend).toHaveBeenCalledOnce();
      const cmd = mockDocSend.mock.calls[0][0];
      expect(cmd.input.Key.pk).toBe("SHELL_GUARD_ALLOWLIST#agent-1");
      expect(cmd.input.Key.sk).toBe("PATTERN#docker");
    });
  });
});
