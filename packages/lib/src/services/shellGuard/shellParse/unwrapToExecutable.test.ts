import { describe, expect, it } from "vitest";
import { extractBasename, unwrapToExecutable } from "./unwrapToExecutable.js";

describe("extractBasename", () => {
  it("strips leading path", () => {
    expect(extractBasename("/usr/bin/env")).toBe("env");
    expect(extractBasename("./tools/x")).toBe("x");
  });

  it("returns the token unchanged when no slash", () => {
    expect(extractBasename("ls")).toBe("ls");
  });

  it("returns the empty string for trailing slash", () => {
    expect(extractBasename("/")).toBe("");
  });
});

describe("unwrapToExecutable", () => {
  it("returns the first non-wrapper as executable", () => {
    expect(unwrapToExecutable(["ls", "-la"])).toEqual({
      executable: "ls",
      blocked: false,
    });
  });

  it("strips the path from the executable", () => {
    expect(unwrapToExecutable(["/usr/bin/ls", "-la"])).toEqual({
      executable: "ls",
      blocked: false,
    });
  });

  it("unwraps env VAR=VAL plus flags", () => {
    expect(
      unwrapToExecutable(["env", "FOO=bar", "BAZ=qux", "-i", "python", "x.py"]),
    ).toEqual({ executable: "python", blocked: false });
  });

  it("unwraps env --", () => {
    expect(unwrapToExecutable(["env", "--", "python", "x.py"])).toEqual({
      executable: "python",
      blocked: false,
    });
  });

  it("unwraps nice -n 10", () => {
    expect(unwrapToExecutable(["nice", "-n", "10", "make"])).toEqual({
      executable: "make",
      blocked: false,
    });
  });

  it("unwraps nice --adjustment 5", () => {
    expect(unwrapToExecutable(["nice", "--adjustment", "5", "make"])).toEqual({
      executable: "make",
      blocked: false,
    });
  });

  it("unwraps timeout 30 command", () => {
    expect(unwrapToExecutable(["timeout", "30", "curl", "https://x"])).toEqual({
      executable: "curl",
      blocked: false,
    });
  });

  it("unwraps timeout with flags", () => {
    expect(
      unwrapToExecutable(["timeout", "-k", "5", "-s", "TERM", "30", "curl"]),
    ).toEqual({ executable: "curl", blocked: false });
  });

  it("unwraps nohup", () => {
    expect(unwrapToExecutable(["nohup", "python", "server.py"])).toEqual({
      executable: "python",
      blocked: false,
    });
  });

  it("unwraps stdbuf", () => {
    expect(
      unwrapToExecutable(["stdbuf", "-o", "0", "-e", "0", "grep", "pattern"]),
    ).toEqual({ executable: "grep", blocked: false });
  });

  it("flags blocked wrappers", () => {
    expect(unwrapToExecutable(["sudo", "rm", "-rf", "/"])).toEqual({
      executable: "sudo",
      blocked: true,
    });
    expect(unwrapToExecutable(["doas", "rm"])).toEqual({
      executable: "doas",
      blocked: true,
    });
  });

  it("unwraps nested transparent wrappers (env → timeout → cmd)", () => {
    expect(
      unwrapToExecutable(["env", "FOO=x", "timeout", "30", "curl", "x"]),
    ).toEqual({ executable: "curl", blocked: false });
  });

  it("returns null executable on empty argv", () => {
    expect(unwrapToExecutable([])).toEqual({
      executable: null,
      blocked: false,
    });
  });

  it("bails out after max depth of 4 wrappers", () => {
    // Four env wrappers, then the real cmd — depth limit hits before we
    // ever see the real cmd, so we return whatever's at the current index.
    const argv = [
      "env",
      "A=1",
      "env",
      "B=2",
      "env",
      "C=3",
      "env",
      "D=4",
      "python",
    ];
    const result = unwrapToExecutable(argv);
    // After 4 unwraps, we point at "python" as the current token;
    // the loop exits and we report argv[i] basename.
    expect(result).toEqual({ executable: "python", blocked: false });
  });
});
