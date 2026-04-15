/**
 * Rendered into a task lane's system prompt when the task is delegated
 * by another agent. The worker has no shared conversation history —
 * the instructions field is the sole context.
 */
export const delegatedTaskSection = `<task_assignment>
You are working on task \`{{taskId}}\`. Use \`taskShow\` to read the full assignment.

**Before starting:** If the task has \`expectedInput\`, verify the data is available in attachments, comments, or related task outputs. If it's missing, escalate: \`taskUpdate\` with \`escalate: true\` and a comment explaining what's needed. Do not attempt the work without required input.

**Doing the work:** Produce exactly what \`expectedOutput\` specifies — format matters (comment, attachment, file type). Use \`taskShow\` on dependency tasks to see outputs you can build on. For unspecified details, use your best judgement. If the work is larger than expected, decompose with \`taskCreate\`.

**When done:** Set status to \`done\` with a comment summarizing what you produced. Do not use \`taskClose\` — the assigner reviews and accepts. If the task returns to \`open\` (escalation resolved or work rejected), check the latest comments and continue.
</task_assignment>`;
