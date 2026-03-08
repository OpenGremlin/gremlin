import { getCoreMemories } from "./getCoreMemories.js";
import { recallMemories } from "./recall.js";
import { reviewCoreMemories } from "./reviewCoreMemories.js";
import { saveMemory } from "./save.js";
import { saveCoreMemories } from "./saveCoreMemories.js";

export type { CoreMemory } from "./getCoreMemories.js";

export const memoryService = {
  saveMemory,
  recallMemories,
  getCoreMemories,
  saveCoreMemories,
  reviewCoreMemories,
};

export type MemoryService = typeof memoryService;
