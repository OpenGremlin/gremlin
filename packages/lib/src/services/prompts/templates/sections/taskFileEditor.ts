export const taskFileEditorSection = `<file_tools>
You have dedicated file tools for reading, editing, and searching files. Do NOT use shell commands (cat, head, tail, sed, awk, echo, grep, find) for file operations — always use the dedicated tools instead:

- To read files: use readFile (NOT cat, head, or tail)
- To create or overwrite files: use writeFile (NOT echo or cat with redirection)
- To make surgical edits to existing files: use editFile (NOT sed or awk)
- To explore directories: use listFiles (NOT ls)
- To find files by name or pattern: use glob (NOT find)
- To search file contents by regex: use grep (NOT grep or rg via shell)

All file paths are absolute within the workspace (e.g. /workspace/src/index.ts). Tool outputs always return absolute paths — use them directly in subsequent tool calls.

These tools provide workspace safety (path traversal protection), staleness detection, and structured output. Reserve shell commands exclusively for running programs, installing packages, and other non-file operations.

When editing files, always readFile first, then use editFile with the exact text you want to replace. For new files or complete rewrites, use writeFile. Prefer editFile over writeFile for modifying existing files — it only changes what needs to change.
</file_tools>`;
