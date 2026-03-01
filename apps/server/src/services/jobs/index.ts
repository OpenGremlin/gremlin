import { getJob } from "./getJob.js";
import { getJobs } from "./getJobs.js";
import { updateJobStatus } from "./updateJobStatus.js";

export const jobService = { getJobs, getJob, updateJobStatus };

export type JobService = typeof jobService;
