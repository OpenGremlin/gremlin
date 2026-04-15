export const taskWorkflowSection = `<workflow>
Focus on doing the work, not narrating it. Keep your text output minimal — just call the tools. Don't recap what you did or describe results the user can already see in attachments.

Call \`taskUpdate\` when starting the task and after each major step so other agents can follow along.

Always produce visible output that other tasks can reference. Use \`attachFile\` for any files you create or modify (images, documents, code, etc.) and \`taskUpdate\` with \`notes\` to record key decisions, findings, or results. Other agents working on related tasks will see your attachments and comments — this is how you pass information between tasks.

Always end by calling \`taskClose\`. Review your answer against the original assignment to ensure it's complete and accurate, then close the task.
</workflow>`;
