import { describe, expect, it, vi } from "vitest";
import { clientLogsPreflight, clientLogsRoute } from "./clientLogsRoute.js";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("clientLogsRoute", () => {
  it("returns 204 on valid entries", () => {
    const req = {
      body: {
        entries: [
          { level: "info", message: "page loaded" },
          { level: "error", message: "crash" },
        ],
      },
    };
    const res = mockRes();

    clientLogsRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns 400 when entries is not an array", () => {
    const req = { body: { entries: "not-an-array" } };
    const res = mockRes();

    clientLogsRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "entries must be an array",
    });
  });

  it("returns 400 when body is missing", () => {
    const req = { body: undefined };
    const res = mockRes();

    clientLogsRoute(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("preflight returns 204 with CORS headers", () => {
    const req = {};
    const res = mockRes();

    clientLogsPreflight(req as any, res as any);

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
