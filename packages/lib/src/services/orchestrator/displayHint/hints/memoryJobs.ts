import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const saveMemory: HintBuilder = (input) => ({
  text: `Saving memory: ${(input?.key as string) ?? (input?.topic as string) ?? "memory"}`,
});

const recallMemory: HintBuilder = (input) => ({
  text: `Recalling: ${(input?.query as string) ?? "memories"}`,
});

const listJobs: HintBuilder = () => ({ text: "Listing jobs" });

const scheduleJob: HintBuilder = (input) => ({
  text: `Scheduling job: ${(input?.schedule as string) ?? "job"}`,
});

const updateJob: HintBuilder = () => ({ text: "Updating job" });

export const memoryJobsHints: Record<string, HintBuilder> = {
  [ToolName.SaveMemory]: saveMemory,
  [ToolName.RecallMemory]: recallMemory,
  [ToolName.ListJobs]: listJobs,
  [ToolName.ScheduleJob]: scheduleJob,
  [ToolName.UpdateJob]: updateJob,
};
