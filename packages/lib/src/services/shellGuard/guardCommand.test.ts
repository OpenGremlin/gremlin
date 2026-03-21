import { describe, expect, it, vi } from "vitest";
import { guardCommand } from "./guardCommand.js";
import type { AllowlistProvider } from "./types.js";

function mockAllowlistProvider(
  entries: Array<{ pattern: string }> = [],
): AllowlistProvider {
  return {
    getEntries: vi.fn().mockResolvedValue(entries),
    addEntry: vi.fn().mockResolvedValue(undefined),
    removeEntry: vi.fn().mockResolvedValue(undefined),
  };
}

describe("guardCommand", () => {
  const base = {
    agentId: "agent-1",
    taskId: "task-1",
  };

  describe("safe commands", () => {
    it("allows safe read commands", async () => {
      const result = await guardCommand({
        ...base,
        command: "cat file.txt | grep foo | wc -l",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows safe dev commands", async () => {
      const result = await guardCommand({
        ...base,
        command: "npm install && npm test",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows safe network commands in sandbox preset", async () => {
      const result = await guardCommand({
        ...base,
        command: "curl https://example.com",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows git with full path", async () => {
      const result = await guardCommand({
        ...base,
        command: "/usr/bin/git status",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows commands through env wrapper", async () => {
      const result = await guardCommand({
        ...base,
        command: "env NODE_ENV=production node app.js",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows commands through timeout wrapper", async () => {
      const result = await guardCommand({
        ...base,
        command: "timeout 30 npm test",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows shell builtins", async () => {
      const result = await guardCommand({
        ...base,
        command: "cd /workspace && pwd",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });
  });

  describe("unsafe commands", () => {
    it("flags unknown executables", async () => {
      const result = await guardCommand({
        ...base,
        command: "ffmpeg -i video.mp4 output.gif",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
      if (result.status === "approval_required") {
        expect(result.reason).toContain("ffmpeg");
      }
    });

    it("flags one unsafe command in a safe pipeline", async () => {
      const result = await guardCommand({
        ...base,
        command: "ffmpeg -i video.mp4 -f wav - | sox - output.wav",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
      if (result.status === "approval_required") {
        expect(result.reason).toContain("ffmpeg");
        expect(result.reason).toContain("sox");
      }
    });

    it("flags sudo", async () => {
      const result = await guardCommand({
        ...base,
        command: "sudo apt-get install nginx",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
      if (result.status === "approval_required") {
        expect(result.reason).toContain("sudo");
      }
    });
  });

  describe("dangerous patterns", () => {
    it("flags rm -rf /", async () => {
      const result = await guardCommand({
        ...base,
        command: "rm -rf /",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
      if (result.status === "approval_required") {
        expect(result.reason).toContain("dangerous pattern");
      }
    });

    it("flags rm -rf /*", async () => {
      const result = await guardCommand({
        ...base,
        command: "rm -rf /*",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
      if (result.status === "approval_required") {
        expect(result.reason).toContain("dangerous pattern");
      }
    });

    it("flags fork bomb", async () => {
      const result = await guardCommand({
        ...base,
        command: ":(){ :|:& };:",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
    });
  });

  describe("unparseable commands", () => {
    it("returns invalid for command substitution", async () => {
      const result = await guardCommand({
        ...base,
        command: "echo $(whoami)",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") {
        expect(result.error).toContain("could not be parsed");
      }
    });

    it("returns invalid for backticks", async () => {
      const result = await guardCommand({
        ...base,
        command: "echo `whoami`",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("invalid");
    });
  });

  describe("allowlist", () => {
    it("allows commands in the allowlist", async () => {
      const result = await guardCommand({
        ...base,
        command: "ffmpeg -i video.mp4 output.gif",
        allowlistProvider: mockAllowlistProvider([{ pattern: "ffmpeg" }]),
      });
      expect(result.status).toBe("allowed");
    });

    it("allows commands matching wildcard patterns", async () => {
      const result = await guardCommand({
        ...base,
        command: "ffprobe video.mp4",
        allowlistProvider: mockAllowlistProvider([{ pattern: "ff*" }]),
      });
      expect(result.status).toBe("allowed");
    });

    it("is case-insensitive", async () => {
      const result = await guardCommand({
        ...base,
        command: "FFmpeg -i video.mp4 output.gif",
        allowlistProvider: mockAllowlistProvider([{ pattern: "ffmpeg" }]),
      });
      expect(result.status).toBe("allowed");
    });
  });

  describe("presets", () => {
    it("restricted preset only allows read commands", async () => {
      const result = await guardCommand({
        ...base,
        command: "npm install",
        preset: "restricted",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
    });

    it("restricted preset allows cat", async () => {
      const result = await guardCommand({
        ...base,
        command: "cat README.md",
        preset: "restricted",
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("additionalSafeBins extends the preset", async () => {
      const result = await guardCommand({
        ...base,
        command: "ffmpeg -i video.mp4 output.gif",
        additionalSafeBins: ["ffmpeg"],
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("allowed");
    });

    it("safeBins overrides the preset", async () => {
      const result = await guardCommand({
        ...base,
        command: "ls -la",
        safeBins: ["cat"], // ls not included
        allowlistProvider: mockAllowlistProvider(),
      });
      expect(result.status).toBe("approval_required");
    });
  });
});
