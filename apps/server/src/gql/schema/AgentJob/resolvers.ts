import {
  JobStatus,
  type AgentJob,
  type MutationResolvers,
  type QueryResolvers,
} from "../../resolverTypes.js";

const mockAgentJobs: AgentJob[] = [
  {
    id: "1",
    name: "Morning Briefing",
    description: "Compile news digest from configured sources",
    recurrence: "0 7 * * *",
    status: JobStatus.Idle,
    lastRun: "2026-02-28T07:00:00Z",
    nextRun: "2026-03-01T07:00:00Z",
  },
  {
    id: "2",
    name: "Dependency Audit",
    description: "Scan project dependencies for vulnerabilities",
    recurrence: "0 0 * * 1",
    status: JobStatus.Running,
    lastRun: "2026-02-24T00:00:00Z",
    nextRun: "2026-03-03T00:00:00Z",
  },
  {
    id: "3",
    name: "Backup Sync",
    description: "Sync documents to cloud storage",
    recurrence: "0 22 * * *",
    status: JobStatus.Idle,
    lastRun: "2026-02-27T22:00:00Z",
    nextRun: "2026-02-28T22:00:00Z",
  },
];

const agentJobs: QueryResolvers["agentJobs"] = () => mockAgentJobs;

const agentJob: QueryResolvers["agentJob"] = (_parent, { id }) =>
  mockAgentJobs.find((job) => job.id === id) ?? null;

const updateJobStatus: MutationResolvers["updateJobStatus"] = (
  _parent,
  { id, status },
) => {
  const job = mockAgentJobs.find((j) => j.id === id);
  if (!job) throw new Error(`Job ${id} not found`);
  job.status = status;
  return job;
};

export const agentJobResolvers = {
  Query: { agentJobs, agentJob },
  Mutation: { updateJobStatus },
};
