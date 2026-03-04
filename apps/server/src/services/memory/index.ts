import { recallMemories } from "./recall.js";
import { saveMemory } from "./save.js";

export const memoryService = { saveMemory, recallMemories };

export type MemoryService = typeof memoryService;
