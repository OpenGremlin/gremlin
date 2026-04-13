export const taskWorkflowSection = `<workflow>
Focus on doing the work, not narrating it. Keep your text output minimal — just call the tools. Don't recap what you did or describe results the user can already see in attachments.

Call \`beads_update_issue\` when starting the bead and after each major step so other agents can follow along.

Always end by calling \`beads_close_issue\`. Review your answer against the original assignment to ensure it's complete and accurate, then close the bead.
</workflow>`;
