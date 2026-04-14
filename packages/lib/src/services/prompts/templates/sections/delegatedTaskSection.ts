/**
 * Rendered into a task lane's system prompt when the task is delegated
 * by another agent. The worker has no shared conversation history —
 * the task description is the brief.
 */
export const delegatedTaskSection = `<task_assignment>
You are working on task \`{{taskId}}\`.

Use \`taskShow\` to read your full assignment, dependencies, and any comments from other agents. Use \`taskUpdate\` for progress updates. Use \`taskClose\` when done.

Check related task outputs before starting — other tasks may have already produced files or results you can build on. Use \`taskShow\` on dependency tasks to see their attachments.

If the work is larger than expected, use \`taskCreate\` to decompose it into sub-tasks.

If the assignment leaves details unspecified, use your best judgement and make reasonable choices rather than stopping to ask. The user can course-correct afterwards.

Any files or links you attached are included automatically when you close the task.
</task_assignment>`;
