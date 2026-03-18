# gmail +send

Send an email.

## Usage

```bash
gws gmail +send --to <EMAILS> --subject <SUBJECT> --body <TEXT>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--to` | Yes | — | Recipient email(s), comma-separated |
| `--subject` | Yes | — | Email subject |
| `--body` | Yes | — | Email body (plain text, or HTML with --html) |
| `--from` | — | — | Sender address (for send-as/alias) |
| `--cc` | — | — | CC email(s), comma-separated |
| `--bcc` | — | — | BCC email(s), comma-separated |
| `--html` | — | — | Treat --body as HTML content |
| `-a`, `--attach` | — | — | Attach a file (repeatable, 25 MB total limit) |
| `--dry-run` | — | — | Preview without executing |

## Examples

```bash
gws gmail +send --to alice@example.com --subject 'Hello' --body 'Hi Alice!'
gws gmail +send --to alice@example.com --subject 'Hello' --body 'Hi!' --cc bob@example.com
gws gmail +send --to alice@example.com --subject 'Hello' --body '<b>Bold</b> text' --html
gws gmail +send --to alice@example.com --subject 'Report' --body 'See attached' -a report.pdf
gws gmail +send --to alice@example.com --subject 'Files' --body 'Two files' -a a.pdf -a b.csv
```

## Tips

- Handles RFC 5322 formatting, MIME encoding, and base64 automatically.
- Use `--from` to send from a configured send-as alias.
- With `--html`, use fragment tags (`<p>`, `<b>`, `<a>`, `<br>`, etc.) — no `<html>`/`<body>` wrapper needed.
