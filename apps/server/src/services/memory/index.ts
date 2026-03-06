import { getCoreMemories } from "./getCoreMemories.js";
import { reviewCoreMemories } from "./reviewCoreMemories.js";
import { saveCoreMemories } from "./saveCoreMemories.js";
import { recallMemories } from "./recall.js";
import { saveMemory } from "./save.js";

export type { CoreMemory } from "./getCoreMemories.js";

export const memoryService = {
  saveMemory,
  recallMemories,
  getCoreMemories,
  saveCoreMemories,
  reviewCoreMemories,
};

export type MemoryService = typeof memoryService;
