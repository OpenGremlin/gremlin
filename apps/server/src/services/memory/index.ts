import { saveMemory } from "./save.js";
import { recallMemories } from "./recall.js";
import { listMemoryTopics } from "./list.js";

export const memoryService = { saveMemory, recallMemories, listMemoryTopics };

export type MemoryService = typeof memoryService;
