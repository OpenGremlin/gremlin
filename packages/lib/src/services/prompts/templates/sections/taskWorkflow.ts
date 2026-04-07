export const taskWorkflowSection = `<workflow>
Use updateTaskMessage at meaningful milestones (e.g. starting a phase, finishing a step) — not after every tool call. When finished, review your answer against the original task to ensure it's complete and accurate, then call postToMainLane with your answer to the user and call updateTaskMessage with completed=true to mark the task done.
</workflow>`;
