import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { removeSkill } from "./removeSkill.js";

// Mock DynamoDB DeleteItemCommand
vi.mock("dynamodb-toolbox/entity/actions/delete", () => ({
  DeleteItemCommand: vi.fn(),
}));

// Mock allowlist store
const mockRemoveEntry = vi.fn();
vi.mock("../shellGuard/allowlistStore.js", () => ({
  createAllowlistStore: vi.fn(() => ({
    removeEntry: mockRemoveEntry,
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

// Mock getAgentSkills
const mockGetAgentSkills = vi.fn();
vi.mock("./getAgentSkills.js", () => ({
  getAgentSkills: (...args: unknown[]) => mockGetAgentSkills(...args),
}));

describe("removeSkill", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  const mockSend = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});

    // Set up DynamoDB entity mock chain
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    const mockBuild = vi.fn().mockReturnValue({ key: mockKey });
    ctx.resources.ddb.entities.AgentSkill.build = mockBuild as any;
  });

  it("deletes the skill assignment from DynamoDB", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    await removeSkill(ctx, "agent-1", "ffmpeg");

    expect(mockSend).toHaveBeenCalledOnce();
  });

  it("removes allowedCommands from the allowlist", async () => {
    mockGetSkillTemplateFromS3.mockImplementation((_bucket, skillId) => {
      if (skillId === "ffmpeg") {
        return {
          id: "ffmpeg",
          allowedCommands: ["ffmpeg", "ffprobe"],
        };
      }
      return null;
    });
    mockGetAgentSkills.mockResolvedValue([]);

    await removeSkill(ctx, "agent-1", "ffmpeg");

    expect(mockRemoveEntry).toHaveBeenCalledTimes(2);
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "ffmpeg");
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "ffprobe");
  });

  it("does not remove patterns still needed by other assigned skills", async () => {
    // Removing gws-calendar, but gws-gmail is still assigned — both need "gws"
    mockGetSkillTemplateFromS3.mockImplementation((_bucket, skillId) => {
      if (skillId === "gws-calendar") {
        return {
          id: "gws-calendar",
          allowedCommands: ["gws"],
        };
      }
      if (skillId === "gws-gmail") {
        return {
          id: "gws-gmail",
          allowedCommands: ["gws"],
        };
      }
      return null;
    });
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "gws-gmail", agentId: "agent-1" },
    ]);

    await removeSkill(ctx, "agent-1", "gws-calendar");

    // "gws" is still needed by gws-gmail, so it should NOT be removed
    expect(mockRemoveEntry).not.toHaveBeenCalled();
  });

  it("removes patterns not needed by remaining skills", async () => {
    // Removing ffmpeg. gws-gmail is still assigned but doesn't need ffmpeg/ffprobe
    mockGetSkillTemplateFromS3.mockImplementation((_bucket, skillId) => {
      if (skillId === "ffmpeg") {
        return {
          id: "ffmpeg",
          allowedCommands: ["ffmpeg", "ffprobe"],
        };
      }
      if (skillId === "gws-gmail") {
        return {
          id: "gws-gmail",
          allowedCommands: ["gws"],
        };
      }
      return null;
    });
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "gws-gmail", agentId: "agent-1" },
    ]);

    await removeSkill(ctx, "agent-1", "ffmpeg");

    expect(mockRemoveEntry).toHaveBeenCalledTimes(2);
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "ffmpeg");
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "ffprobe");
  });

  it("does not remove allowlist entries when skill has no allowedCommands", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue({
      id: "custom",
      name: "custom",
    });

    await removeSkill(ctx, "agent-1", "custom");

    expect(mockRemoveEntry).not.toHaveBeenCalled();
    expect(mockGetAgentSkills).not.toHaveBeenCalled();
  });

  it("does not remove allowlist entries when skill template not found", async () => {
    mockGetSkillTemplateFromS3.mockResolvedValue(null);

    await removeSkill(ctx, "agent-1", "nonexistent");

    expect(mockRemoveEntry).not.toHaveBeenCalled();
  });

  it("handles partial overlap — only removes unneeded patterns", async () => {
    // Removing imagemagick (magick, convert, identify, mogrify)
    // Another skill also needs "convert"
    mockGetSkillTemplateFromS3.mockImplementation((_bucket, skillId) => {
      if (skillId === "imagemagick") {
        return {
          id: "imagemagick",
          allowedCommands: ["magick", "convert", "identify", "mogrify"],
        };
      }
      if (skillId === "other-skill") {
        return {
          id: "other-skill",
          allowedCommands: ["convert"],
        };
      }
      return null;
    });
    mockGetAgentSkills.mockResolvedValue([
      { skillId: "other-skill", agentId: "agent-1" },
    ]);

    await removeSkill(ctx, "agent-1", "imagemagick");

    // "convert" is still needed, but magick/identify/mogrify should be removed
    expect(mockRemoveEntry).toHaveBeenCalledTimes(3);
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "magick");
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "identify");
    expect(mockRemoveEntry).toHaveBeenCalledWith("agent-1", "mogrify");
    expect(mockRemoveEntry).not.toHaveBeenCalledWith("agent-1", "convert");
  });
});
