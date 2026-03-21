import { describe, expect, it } from "vitest";
import {
  analyzeCommand,
  splitCommandChain,
  splitShellArgs,
} from "./shellParse.js";

describe("splitShellArgs", () => {
  it("splits simple tokens", () => {
    expect(splitShellArgs("ls -la /tmp")).toEqual(["ls", "-la", "/tmp"]);
  });

  it("handles single quotes", () => {
    expect(splitShellArgs("echo 'hello world'")).toEqual([
      "echo",
      "hello world",
    ]);
  });

  it("handles double quotes", () => {
    expect(splitShellArgs('echo "hello world"')).toEqual([
      "echo",
      "hello world",
    ]);
  });

  it("handles escaped characters", () => {
    expect(splitShellArgs("echo hello\\ world")).toEqual([
      "echo",
      "hello world",
    ]);
  });

  it("handles double-quote escapes", () => {
    expect(splitShellArgs('echo "foo\\"bar"')).toEqual(["echo", 'foo"bar']);
  });

  it("returns null for unclosed single quote", () => {
    expect(splitShellArgs("echo 'unclosed")).toBeNull();
  });

  it("returns null for unclosed double quote", () => {
    expect(splitShellArgs('echo "unclosed')).toBeNull();
  });

  it("handles empty input", () => {
    expect(splitShellArgs("")).toEqual([]);
  });

  it("ignores comments", () => {
    expect(splitShellArgs("echo hello # world")).toEqual(["echo", "hello"]);
  });

  it("does not treat # inside a word as comment", () => {
    expect(splitShellArgs("echo foo#bar")).toEqual(["echo", "foo#bar"]);
  });

  it("handles mixed quotes", () => {
    expect(splitShellArgs(`echo 'single' "double"`)).toEqual([
      "echo",
      "single",
      "double",
    ]);
  });
});

describe("splitCommandChain", () => {
  it("returns null for simple commands", () => {
    expect(splitCommandChain("ls -la")).toBeNull();
  });

  it("splits on &&", () => {
    expect(splitCommandChain("cd /tmp && ls")).toEqual(["cd /tmp", "ls"]);
  });

  it("splits on ||", () => {
    expect(splitCommandChain("test -f foo || echo no")).toEqual([
      "test -f foo",
      "echo no",
    ]);
  });

  it("splits on ;", () => {
    expect(splitCommandChain("echo a; echo b")).toEqual(["echo a", "echo b"]);
  });

  it("splits on mixed operators", () => {
    expect(splitCommandChain("a && b || c; d")).toEqual(["a", "b", "c", "d"]);
  });

  it("preserves quoted strings containing operators", () => {
    expect(splitCommandChain('echo "a && b" && ls')).toEqual([
      'echo "a && b"',
      "ls",
    ]);
  });

  it("returns null for trailing operator", () => {
    expect(splitCommandChain("echo hello &&")).toBeNull();
  });

  it("returns null for leading operator", () => {
    expect(splitCommandChain("&& echo hello")).toBeNull();
  });
});

describe("analyzeCommand", () => {
  it("parses simple command", () => {
    const result = analyzeCommand("ls -la");
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].executable).toBe("ls");
  });

  it("parses pipeline", () => {
    const result = analyzeCommand("cat file.txt | grep foo | wc -l");
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].executable).toBe("cat");
    expect(result.segments[1].executable).toBe("grep");
    expect(result.segments[2].executable).toBe("wc");
  });

  it("parses chain + pipeline", () => {
    const result = analyzeCommand("git pull && npm test | grep PASS");
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].executable).toBe("git");
    expect(result.segments[1].executable).toBe("npm");
    expect(result.segments[2].executable).toBe("grep");
  });

  it("unwraps env wrapper", () => {
    const result = analyzeCommand("env FOO=bar node app.js");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("node");
  });

  it("unwraps timeout wrapper", () => {
    const result = analyzeCommand("timeout 30 ffmpeg -i video.mp4");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("ffmpeg");
  });

  it("unwraps nice wrapper", () => {
    const result = analyzeCommand("nice -n 10 make -j4");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("make");
  });

  it("unwraps nohup wrapper", () => {
    const result = analyzeCommand("nohup python3 train.py");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("python3");
  });

  it("unwraps stdbuf wrapper", () => {
    const result = analyzeCommand("stdbuf -o L tail -f log.txt");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("tail");
  });

  it("flags sudo as blocked wrapper", () => {
    const result = analyzeCommand("sudo rm -rf /");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("sudo");
  });

  it("flags doas as blocked wrapper", () => {
    const result = analyzeCommand("doas apt install foo");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("doas");
  });

  it("unwraps nested wrappers", () => {
    const result = analyzeCommand("env FOO=1 nice -n 5 timeout 60 cargo build");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("cargo");
  });

  it("strips path from executable", () => {
    const result = analyzeCommand("/usr/bin/grep pattern");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("grep");
  });

  it("rejects command substitution $()", () => {
    const result = analyzeCommand("echo $(whoami)");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("$()");
  });

  it("rejects backtick substitution", () => {
    const result = analyzeCommand("echo `whoami`");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("`");
  });

  it("allows redirections in sandbox context", () => {
    const result = analyzeCommand("echo hello > output.txt");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("echo");
  });

  it("allows input redirection", () => {
    const result = analyzeCommand("cat < input.txt");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("cat");
  });

  it("allows heredocs with redirection", () => {
    const result = analyzeCommand("cat > output.md <<'EOF'\nhello\nEOF");
    expect(result.ok).toBe(true);
    expect(result.segments[0].executable).toBe("cat");
  });

  it("allows subshells", () => {
    const result = analyzeCommand("(echo hello)");
    expect(result.ok).toBe(true);
  });

  it("returns not-ok for empty command", () => {
    const result = analyzeCommand("");
    expect(result.ok).toBe(false);
  });

  it("handles quoted executable with spaces in pipeline", () => {
    const result = analyzeCommand("grep 'hello world' | wc -l");
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].executable).toBe("grep");
    expect(result.segments[1].executable).toBe("wc");
  });

  it("preserves && inside quotes", () => {
    const result = analyzeCommand('grep "foo && bar" file.txt');
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].executable).toBe("grep");
  });
});
