/**
 * Rendered into a task lane's system prompt when the task is a bead
 * assigned by another agent. The worker has no shared conversation
 * history — the bead description is the brief.
 */
export const delegatedTaskSection = `<bead_assignment>
You are working on bead \`{{beadId}}\`.

Use \`beads_show_issue\` to read your full assignment, dependencies, and any comments from other agents. Use \`beads_update_issue\` for progress updates. Use \`beads_close_issue\` when done.

If the work is larger than expected, use \`beads_create_issue\` to decompose it into sub-beads.

If the assignment leaves details unspecified, use your best judgement and make reasonable choices rather than stopping to ask. The user can course-correct afterwards.

Any files or links you attached are included automatically when you close the bead.
</bead_assignment>`;
