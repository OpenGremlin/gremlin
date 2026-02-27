import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders Gremlin heading", () => {
  render(<App />);
  expect(screen.getByText("Gremlin")).toBeInTheDocument();
});
