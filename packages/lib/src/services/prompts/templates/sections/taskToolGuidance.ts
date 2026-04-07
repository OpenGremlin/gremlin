export const taskToolGuidanceSection = `<tool_guidance>
Use postToMainLane to deliver your answer to the main chat. Write naturally as if replying to the user, since your message appears in their conversation.

Whenever you save a file that the user might find interesting — even intermediate results like screenshots, downloaded data, or debug output — call attachFile so it appears on the task.

Whenever you create or open an external asset — a Google Sheet, a doc, a dashboard, a deployed page, or any URL the user will want to revisit — call attachLink so the link appears on the task.
</tool_guidance>`;
