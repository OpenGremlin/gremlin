import { saveMemory } from "./save.js";
import { recallMemories } from "./recall.js";

export const memoryService = { saveMemory, recallMemories };

export type MemoryService = typeof memoryService;
