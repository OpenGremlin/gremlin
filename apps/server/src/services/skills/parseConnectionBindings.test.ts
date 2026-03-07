import { describe, expect, it } from "vitest";
import { parseConnectionBindings } from "./parseConnectionBindings.js";

describe("parseConnectionBindings", () => {
  it("returns empty object for null", () => {
    expect(parseConnectionBindings(null)).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(parseConnectionBindings(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseConnectionBindings("")).toEqual({});
  });

  it("parses valid JSON", () => {
    const input = JSON.stringify({ slack: "conn_123", github: "conn_456" });
    expect(parseConnectionBindings(input)).toEqual({
      slack: "conn_123",
      github: "conn_456",
    });
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseConnectionBindings("{not valid json}")).toEqual({});
    expect(parseConnectionBindings("hello")).toEqual({});
    expect(parseConnectionBindings("{")).toEqual({});
  });

  it("parses nested/complex JSON strings", () => {
    const input = JSON.stringify({
      a: "1",
      b: "2",
      nested: JSON.stringify({ inner: "value" }),
    });
    const result = parseConnectionBindings(input);
    expect(result).toEqual({
      a: "1",
      b: "2",
      nested: '{"inner":"value"}',
    });
  });
});
