import { describe, expect, it } from "vitest";
import { validateToolNames } from "./validateToolNames.js";

describe("validateToolNames", () => {
  it("accepts names Bedrock allows", () => {
    expect(() =>
      validateToolNames({
        readFile: {},
        save_memory: {},
        "tool-1": {},
        canvasShow: {},
      }),
    ).not.toThrow();
  });

  it("rejects dotted names (the canvas.show regression)", () => {
    expect(() => validateToolNames({ "canvas.show": {} })).toThrow(
      /canvas\.show/,
    );
  });
});
