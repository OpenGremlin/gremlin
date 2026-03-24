import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/wsClient", () => ({
  getWsClient: () => ({ subscribe: () => () => {} }),
}));

import { shouldShowTimestamp } from "./useLogMessages";

function makeMsg(
  overrides: Partial<{
    role: string;
    createdAt: string;
  }> = {},
) {
  return {
    id: "1",
    role: "AGENT" as const,
    content: "hello",
    createdAt: "2025-06-15T12:00:00Z",
    ...overrides,
  } as Parameters<typeof shouldShowTimestamp>[0];
}

describe("shouldShowTimestamp", () => {
  it("returns true when there is no next message", () => {
    expect(shouldShowTimestamp(makeMsg(), undefined)).toBe(true);
  });

  it("returns true when roles differ", () => {
    const msg = makeMsg({ role: "USER" });
    const next = makeMsg({ role: "AGENT" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("returns false for same role within 15 minutes", () => {
    const msg = makeMsg({ createdAt: "2025-06-15T12:00:00Z" });
    const next = makeMsg({ createdAt: "2025-06-15T12:10:00Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(false);
  });

  it("returns true for same role with >= 15 minute gap", () => {
    const msg = makeMsg({ createdAt: "2025-06-15T12:00:00Z" });
    const next = makeMsg({ createdAt: "2025-06-15T12:15:00Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });

  it("returns true at exactly 15 minutes", () => {
    const msg = makeMsg({ createdAt: "2025-06-15T12:00:00Z" });
    const next = makeMsg({ createdAt: "2025-06-15T12:15:00Z" });
    expect(shouldShowTimestamp(msg, next)).toBe(true);
  });
});
