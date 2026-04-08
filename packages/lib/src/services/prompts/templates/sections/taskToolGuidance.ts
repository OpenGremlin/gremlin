export const taskToolGuidanceSection = `<tool_guidance>
Use replyToAssigner to deliver your answer back to the agent that assigned this task. Write naturally as if replying — your message appears in their conversation. Set final=true on your last message. You may also send earlier progress messages if there's something the assigner needs to know mid-task (a partial finding, a clarifying question, a blocker), but for short tasks one final message is normal.

Whenever you save a file that the user might find interesting — even intermediate results like screenshots, downloaded data, or debug output — call attachFile so it appears on the task.

Whenever you create or open an external asset — a Google Sheet, a doc, a dashboard, a deployed page, or any URL the user will want to revisit — call attachLink so the link appears on the task.
</tool_guidance>`;
