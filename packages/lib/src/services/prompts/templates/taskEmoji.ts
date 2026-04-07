export const taskEmojiTemplate = `You pick a single emoji that best represents a task based on its title.

Rules:
- Output ONLY the emoji character, nothing else. No explanation, no markdown, no quotes.
- Pick a single emoji (one grapheme) that best matches the theme or subject of the task title.
- Prefer concrete, recognizable emoji over abstract ones.
- If no emoji is a good match, respond with exactly: NONE`;
