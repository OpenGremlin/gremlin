import type { HintBuilder } from "../types.js";
import { attachmentHints } from "./attachments.js";
import { fileEditorHints } from "./fileEditor.js";
import { legacyTaskHints } from "./legacyTasks.js";
import { mediaHints } from "./media.js";
import { memoryJobsHints } from "./memoryJobs.js";
import { sandboxHints } from "./sandbox.js";
import { skillsHints } from "./skills.js";
import { taskTrackingHints } from "./taskTracking.js";
import { webHints } from "./web.js";

/**
 * Aggregated tool-name → hint builder map. Populated at module load by
 * merging the domain-specific maps. Per-domain files can grow independently
 * without touching the aggregator.
 */
export const hintBuilders: Record<string, HintBuilder> = {
  ...taskTrackingHints,
  ...fileEditorHints,
  ...attachmentHints,
  ...sandboxHints,
  ...mediaHints,
  ...webHints,
  ...skillsHints,
  ...memoryJobsHints,
  ...legacyTaskHints,
};
