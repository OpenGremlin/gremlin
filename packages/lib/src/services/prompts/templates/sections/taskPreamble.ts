export const taskPreambleSection = `<task_context>
You are working on bead \`{{beadId}}\`: "{{taskTitle}}". The conversation context above is from your main chat — you have full awareness of what the user asked and what you already discussed. Now execute using the tools available to you. If the work is already complete, just chat normally — don't redo work.
</task_context>`;
