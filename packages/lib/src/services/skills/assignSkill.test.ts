import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { assignSkill } from "./assignSkill.js";

// Mock DynamoDB PutItemCommand
vi.mock("dynamodb-toolbox/entity/actions/put", () => ({
  PutItemCommand: vi.fn(),
}));

// Mock allowlist store
const mockAddEntry = vi.fn();
vi.mock("../shellGuard/allowlistStore.js", () => ({
  createAllowlistStore: vi.fn(() => ({
    addEntry: mockAddEntry,
  })),
}));

// Mock skill template lookup
const mockGetSkillTemplateFromS3 = vi.fn();
vi.mock("./skillScanner/index.js", () => ({
  getSkillTemplateFromS3: (...args: unknown[]) =>
    mockGetSkillTemplateFromS3(...args),
}));

vi.mock("./getSkillsBucket.js", () => ({
  getSkillsBucket: () => "test-bucket",
}));

describe("assignSkill", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  const mockSend = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});

    // Set up DynamoDB entity mock chain
    const mockItem = vi.fn().mockReturnValue({ send: mockSend });
    const mockBuild = vi.fn().mockReturnValue({ item: mockItem });
    ctx.resources.ddb.entities.AgentSkill.build = mockBuild as any;
  });

  it("writes skill assignment to DynamoDB", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    const result = await assignSkill(ctx, "agent-1", "ffmpeg");

    expect(result.agentId).toBe("agent-1");
    expect(result.skillId).toBe("ffmpeg");
    expect(result.assignedAt).toBeTruthy();
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it("adds allowedCommands to the shell guard allowlist", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue({
      id: "ffmpeg",
      name: "ffmpeg",
      description: "video processing",
      version: "1.0.0",
      allowedCommands: ["ffmpeg", "ffprobe"],
    });

    await assignSkill(ctx, "agent-1", "ffmpeg");

    expect(mockAddEntry).toHaveBeenCalledTimes(2);
    expect(mockAddEntry).toHaveBeenCalledWith("agent-1", {
      pattern: "ffmpeg",
    });
    expect(mockAddEntry).toHaveBeenCalledWith("agent-1", {
      pattern: "ffprobe",
    });
  });

  it("does not add allowlist entries when skill has no allowedCommands", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue({
      id: "custom",
      name: "custom",
      description: "no commands",
      version: "1.0.0",
    });

    await assignSkill(ctx, "agent-1", "custom");

    expect(mockAddEntry).not.toHaveBeenCalled();
  });

  it("does not add allowlist entries when skill template not found", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    await assignSkill(ctx, "agent-1", "nonexistent");

    expect(mockAddEntry).not.toHaveBeenCalled();
  });

  it("stores connection bindings as JSON", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    const result = await assignSkill(ctx, "agent-1", "gws-gmail", {
      google: "conn-123",
    });

    expect(result.connectionBindings).toBe('{"google":"conn-123"}');
  });

  it("sets connectionBindings to null when not provided", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    const result = await assignSkill(ctx, "agent-1", "ffmpeg");

    expect(result.connectionBindings).toBeNull();
  });
});
