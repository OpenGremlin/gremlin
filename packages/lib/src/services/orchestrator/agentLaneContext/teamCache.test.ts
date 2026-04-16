import { beforeEach, describe, expect, it, vi } from "vitest";
import { _clearTeamCache, getCachedTeam, setCachedTeam } from "./teamCache.js";
import type { TeamMember } from "./types.js";

function makeTeam(ids: string[]): TeamMember[] {
  return ids.map((id) => ({
    id,
    name: id.toUpperCase(),
    skillBlurb: "",
  }));
}

describe("teamCache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    _clearTeamCache();
  });

  it("returns null when nothing cached", () => {
    expect(getCachedTeam("manager-1")).toBeNull();
  });

  it("returns the cached team within TTL", () => {
    const team = makeTeam(["a", "b"]);
    setCachedTeam("manager-1", team);
    expect(getCachedTeam("manager-1")).toEqual(team);
  });

  it("scopes cache per manager id", () => {
    setCachedTeam("manager-1", makeTeam(["a"]));
    setCachedTeam("manager-2", makeTeam(["b"]));

    expect(getCachedTeam("manager-1")?.map((t) => t.id)).toEqual(["a"]);
    expect(getCachedTeam("manager-2")?.map((t) => t.id)).toEqual(["b"]);
  });

  it("expires entries after the 30s TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T00:00:00Z"));
    setCachedTeam("manager-1", makeTeam(["a"]));

    // 29s — still cached
    vi.setSystemTime(new Date("2026-04-16T00:00:29Z"));
    expect(getCachedTeam("manager-1")).not.toBeNull();

    // 31s — expired
    vi.setSystemTime(new Date("2026-04-16T00:00:31Z"));
    expect(getCachedTeam("manager-1")).toBeNull();
  });

  it("_clearTeamCache wipes every entry", () => {
    setCachedTeam("m1", makeTeam(["a"]));
    setCachedTeam("m2", makeTeam(["b"]));
    _clearTeamCache();
    expect(getCachedTeam("m1")).toBeNull();
    expect(getCachedTeam("m2")).toBeNull();
  });

  it("setCachedTeam overwrites an existing entry", () => {
    setCachedTeam("manager-1", makeTeam(["a"]));
    setCachedTeam("manager-1", makeTeam(["x", "y"]));
    expect(getCachedTeam("manager-1")?.map((t) => t.id)).toEqual(["x", "y"]);
  });
});
