import { describe, expect, it, vi } from "vitest";

// Stub the expo-router Link with a recognizable marker so we can assert
// which branch ListCard rendered. Link.Trigger / Link.Preview are accessed
// as static properties on the function, matching the real API shape.
// vi.hoisted runs before vi.mock factories so the stubs survive hoisting.
const { LinkStub } = vi.hoisted(() => {
  const LinkStub = Object.assign(
    function LinkStub() {
      return null;
    },
    {
      Trigger: function LinkTrigger() {
        return null;
      },
      Preview: function LinkPreview() {
        return null;
      },
    },
  );
  return { LinkStub };
});

vi.mock("expo-router", () => ({ Link: LinkStub }));

vi.mock("./AgentAvatar", () => ({
  AgentAvatar: function AgentAvatarStub() {
    return null;
  },
}));

vi.mock("./Card", () => ({
  Card: function CardStub() {
    return null;
  },
}));

import { ListCard } from "./ListCard";

describe("ListCard", () => {
  it("renders inside expo-router Link when given href", () => {
    const tree = ListCard({
      agentId: "a1",
      title: "Test agent",
      href: "/agents/a1",
    });
    expect(tree.type).toBe(LinkStub);
    expect(tree.props.href).toBe("/agents/a1");
  });

  it("renders Link.Trigger and Link.Preview as Link children", () => {
    const tree = ListCard({
      agentId: "a1",
      title: "Test agent",
      href: "/agents/a1",
    });
    const children = Array.isArray(tree.props.children)
      ? tree.props.children
      : [tree.props.children];
    const childTypes = children.map((c: { type: unknown }) => c.type);
    expect(childTypes).toContain(LinkStub.Trigger);
    expect(childTypes).toContain(LinkStub.Preview);
  });

  it("renders a Pressable with onPress when no href", () => {
    const onPress = vi.fn();
    const tree = ListCard({
      agentId: "a1",
      title: "Test agent",
      onPress,
    });
    // Pressable from react-native is mocked to a string in the harness;
    // either way it should not be the Link stub.
    expect(tree.type).not.toBe(LinkStub);
    expect(tree.props.onPress).toBe(onPress);
  });
});
