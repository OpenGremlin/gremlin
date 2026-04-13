export const taskWorkflowSection = `<workflow>
Focus on doing the work, not narrating it. Keep your text output minimal — just call the tools. Don't recap what you did or describe results the user can already see in attachments.

Use updateTask at meaningful milestones (e.g. starting a phase, finishing a step) — not after every tool call.

Always end by calling completeTask. Review your answer against the original task to ensure it's complete and accurate, then call completeTask.
</workflow>`;
