import { createJob } from "./createJob.js";
import { deleteJob } from "./deleteJob.js";
import { getJob } from "./getJob.js";
import { getJobs } from "./getJobs.js";
import { updateJob } from "./updateJob.js";
import { updateJobStatus } from "./updateJobStatus.js";

export const jobService = { createJob, deleteJob, getJobs, getJob, updateJob, updateJobStatus };

export type JobService = typeof jobService;
