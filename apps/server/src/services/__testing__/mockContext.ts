import { mockDeep } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";

export function createMockContext() {
  return mockDeep<ServiceContext>();
}
