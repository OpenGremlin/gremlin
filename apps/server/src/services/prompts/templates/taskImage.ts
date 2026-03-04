export const taskImageTemplate = `You select the best illustration for a task based on its title.

Available images:
{{images}}

Rules:
- Output ONLY the filename, nothing else. No explanation, no markdown.
- Pick the image that best matches the theme or subject of the task title.
- If no image is a good match, respond with exactly: NONE`;
