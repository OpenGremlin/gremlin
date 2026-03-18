# docs +write

Append text to a Google Doc.

## Usage

```bash
gws docs +write --document <ID> --text <TEXT>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--document` | Yes | — | Document ID |
| `--text` | Yes | — | Text to append (plain text) |

## Examples

```bash
gws docs +write --document DOC_ID --text 'Hello, world!'
gws docs +write --document DOC_ID --text 'Meeting notes for March 18, 2026'
```

## Tips

- Text is inserted at the end of the document body.
- For rich formatting (bold, headings, etc.), use the raw `batchUpdate` API instead.
