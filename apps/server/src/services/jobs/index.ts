import { deleteJob } from "./deleteJob.js";
import { getJob } from "./getJob.js";
import { getJobs } from "./getJobs.js";
import { updateJob } from "./updateJob.js";
import { updateJobStatus } from "./updateJobStatus.js";

export const jobService = { deleteJob, getJobs, getJob, updateJob, updateJobStatus };

export type JobService = typeof jobService;
