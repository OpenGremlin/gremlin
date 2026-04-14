export const taskWorkflowSection = `<workflow>
Focus on doing the work, not narrating it. Keep your text output minimal — just call the tools. Don't recap what you did or describe results the user can already see in attachments.

Call \`taskUpdate\` when starting the task and after each major step so other agents can follow along.

Always end by calling \`taskClose\`. Review your answer against the original assignment to ensure it's complete and accurate, then close the task.
</workflow>`;
