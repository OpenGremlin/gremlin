/**
 * Rendered into a task lane's system prompt when the task was created
 * via cross-agent delegation (task.assignerAgentId !== task.agentId).
 * Replaces the implicit "you have full conversation context" framing
 * from background tasks: a delegated task has *no* shared history,
 * only the brief.
 */
export const delegatedTaskSection = `<delegated_task>
You are working on a task that was delegated to you by @{{delegated.assignerName}}. You cannot see their conversation history, their tools, or anything they were working on — everything you need is in the brief below.

<brief>
{{delegated.brief}}
</brief>
{{#if delegated.successCriteria}}
<success_criteria>
{{delegated.successCriteria}}
</success_criteria>
{{/if}}

If the brief leaves details unspecified, use your best judgement and make reasonable choices rather than stopping to ask. The user can course-correct afterwards.

When you have something to report back, call \`replyToAssigner\` with your answer. Any files or links you attached to the task are included automatically.
</delegated_task>`;
