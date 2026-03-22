import { afterEach, describe, expect, it, vi } from "vitest";

describe("getSkillsBucket", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  async function load() {
    const mod = await import("./getSkillsBucket.js");
    return mod.getSkillsBucket;
  }

  it("returns bucket name when SKILLS_BUCKET is set", async () => {
    process.env.SKILLS_BUCKET = "my-bucket";
    const getSkillsBucket = await load();
    expect(getSkillsBucket()).toBe("my-bucket");
  });

  it("returns null when SKILLS_BUCKET is empty", async () => {
    process.env.SKILLS_BUCKET = "";
    const getSkillsBucket = await load();
    expect(getSkillsBucket()).toBeNull();
  });

  it("returns null when SKILLS_BUCKET is not set", async () => {
    delete process.env.SKILLS_BUCKET;
    const getSkillsBucket = await load();
    expect(getSkillsBucket()).toBeNull();
  });

  it("throws in production when SKILLS_BUCKET is not set", async () => {
    delete process.env.SKILLS_BUCKET;
    process.env.NODE_ENV = "production";
    const getSkillsBucket = await load();
    expect(() => getSkillsBucket()).toThrow(
      "SKILLS_BUCKET must be set in production",
    );
  });
});
