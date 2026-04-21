import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Resources } from "../../resources/index.js";
import {
  bindAgent,
  createSession,
  getSession,
  verifyCanvasToken,
} from "./index.js";

function stubEntity(map: Record<string, unknown>): void {
  // dynamodb-toolbox entity.build(...) returns a chain that ends in
  // send(). Stub each action class's send to read from our in-memory
  // map. Covers Get / Put / Update / Delete.
  const buildMock = {
    key: vi.fn().mockImplementation(function (
      this: typeof buildMock,
      k: {
        sessionId?: string;
        agentId?: string;
        userId?: string;
      },
    ) {
      (this as { _key?: typeof k })._key = k;
      return this;
    }),
    item: vi.fn().mockImplementation(function (
      this: typeof buildMock,
      item: {
        sessionId?: string;
      },
    ) {
      (this as { _item?: typeof item })._item = item;
      return this;
    }),
    send: vi.fn().mockImplementation(async function (this: {
      _item?: { sessionId?: string; [k: string]: unknown };
      _key?: { sessionId?: string };
    }) {
      if (this._key) {
        const id = this._key.sessionId ?? "";
        return { Item: map[id] };
      }
      if (this._item?.sessionId) {
        map[this._item.sessionId] = {
          ...(map[this._item.sessionId] as object),
          ...this._item,
        };
      }
      return {};
    }),
  };
  (resources.ddb.entities.CanvasSession.build as unknown) = vi
    .fn()
    .mockReturnValue(buildMock);
}

let resources: ReturnType<typeof mockDeep<Resources>>;

beforeEach(() => {
  resources = mockDeep<Resources>();
});

describe("canvas session token", () => {
  it("round-trips through sign + verify", async () => {
    stubEntity({});
    const session = await createSession(resources, "user-1");

    const payload = await verifyCanvasToken(session.token);

    expect(payload.sub).toBe("user-1");
    expect(payload.sid).toBe(session.sessionId);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rejects a tampered token", async () => {
    stubEntity({});
    const session = await createSession(resources, "user-1");

    // Flip a char in the signature segment.
    const parts = session.token.split(".");
    parts[2] = `${parts[2].slice(0, -4)}ABCD`;
    const tampered = parts.join(".");

    await expect(verifyCanvasToken(tampered)).rejects.toThrow();
  });
});

describe("createSession", () => {
  it("writes a row keyed by the generated sessionId", async () => {
    const map: Record<string, unknown> = {};
    stubEntity(map);

    const session = await createSession(resources, "user-1");

    expect(session.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(map[session.sessionId]).toMatchObject({
      sessionId: session.sessionId,
      userId: "user-1",
    });
  });

  it("lets getSession read back the row it just wrote", async () => {
    const map: Record<string, unknown> = {};
    stubEntity(map);
    const session = await createSession(resources, "user-1");

    const row = await getSession(resources, session.sessionId);

    expect(row).toMatchObject({ userId: "user-1" });
  });
});

describe("bindAgent ownership", () => {
  it("throws Forbidden when the caller is not the session's owner", async () => {
    const map: Record<string, unknown> = {};
    stubEntity(map);
    const session = await createSession(resources, "owner");

    await expect(
      bindAgent(resources, session.sessionId, "stranger", "agent-1"),
    ).rejects.toThrow(/Forbidden/);
  });

  it("throws Session not found when the row is missing", async () => {
    stubEntity({});

    await expect(
      bindAgent(resources, "missing-id", "owner", "agent-1"),
    ).rejects.toThrow(/Session not found/);
  });
});
