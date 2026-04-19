import { describe, expect, it, vi } from "vitest";

// Stub ToolBlock so the import chain doesn't pull in expo-linear-gradient
// (which uses JSX syntax vitest's esbuild pipeline can't parse). The stub
// keeps the props so we can assert on them.
const { ToolBlockStub } = vi.hoisted(() => ({
  ToolBlockStub: function ToolBlockStub(props: unknown) {
    return { type: "ToolBlockStub", props };
  },
}));
vi.mock("./ToolBlock", () => ({ ToolBlock: ToolBlockStub }));

const { ToolErrorBlock, ToolErrorText } = await import("./ToolErrorDisplay");

const err = {
  code: "UPSTREAM_ERROR",
  message: "503 Service Unavailable",
  hint: "Retry in a few seconds.",
};

describe("ToolErrorText", () => {
  it("renders a single Text with code as a nested bold Text", () => {
    const tree = ToolErrorText({ toolError: err }) as any;
    // Outer <Text> is the container; its children are [<Text>code</Text>, ': message', ' hint']
    const children = tree.props.children;
    expect(Array.isArray(children)).toBe(true);
    // First child: the bold code span.
    expect(children[0].props.children).toBe("UPSTREAM_ERROR");
    // Subsequent children include the message and hint text.
    const flattened = children
      .slice(1)
      .map((c: unknown) => (typeof c === "string" ? c : ""))
      .join("");
    expect(flattened).toContain("503 Service Unavailable");
    expect(flattened).toContain("Retry in a few seconds.");
  });

  it("omits the hint segment when hint is undefined", () => {
    const tree = ToolErrorText({
      toolError: { code: "TIMEOUT", message: "Timed out" },
    }) as any;
    const tail = tree.props.children.slice(1).join("");
    expect(tail).toBe(": Timed out");
  });

  it("omits the hint segment when hint is null", () => {
    const tree = ToolErrorText({
      toolError: { code: "TIMEOUT", message: "Timed out", hint: null },
    }) as any;
    const tail = tree.props.children.slice(1).join("");
    expect(tail).toBe(": Timed out");
  });
});

describe("ToolErrorBlock", () => {
  it("renders a ToolBlock with the tool label and a ToolErrorText body", () => {
    const tree = ToolErrorBlock({
      label: "runCommand",
      toolError: err,
      createdAt: "2026-04-19T00:00:00Z",
      showTimestamp: true,
    }) as any;
    // Outer tree is the stubbed ToolBlock — assert its props.
    expect(tree.props.label).toBe("runCommand");
    expect(tree.props.createdAt).toBe("2026-04-19T00:00:00Z");
    expect(tree.props.showTimestamp).toBe(true);
    // Children: <View> wrapping <ToolErrorText>.
    const body = tree.props.children; // <View>
    const inner = body.props.children; // <ToolErrorText>
    expect(inner.type).toBe(ToolErrorText);
    expect(inner.props.toolError).toEqual(err);
  });
});
