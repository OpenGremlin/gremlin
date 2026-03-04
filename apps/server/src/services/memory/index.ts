import {
  getCoreMemories,
  reviewCoreMemories,
  saveCoreMemories,
} from "./coreMemories.js";
import { recallMemories } from "./recall.js";
import { saveMemory } from "./save.js";

export type { CoreMemory } from "./coreMemories.js";

export const memoryService = {
  saveMemory,
  recallMemories,
  getCoreMemories,
  saveCoreMemories,
  reviewCoreMemories,
};

export type MemoryService = typeof memoryService;
