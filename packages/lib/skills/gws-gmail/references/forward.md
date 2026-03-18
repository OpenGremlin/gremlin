# gmail +forward

Forward a message to new recipients.

## Usage

```bash
gws gmail +forward --message-id <ID> --to <EMAILS>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--message-id` | Yes | — | Gmail message ID to forward |
| `--to` | Yes | — | Recipient email(s), comma-separated |
| `--from` | — | — | Sender address (for send-as/alias) |
| `--body` | — | — | Optional note above the forwarded message |
| `--cc` | — | — | CC email(s), comma-separated |
| `--bcc` | — | — | BCC email(s), comma-separated |
| `--html` | — | — | Treat --body as HTML content |
| `-a`, `--attach` | — | — | Attach a file (repeatable) |
| `--dry-run` | — | — | Preview without executing |

## Examples

```bash
gws gmail +forward --message-id 18f1a2b3c4d --to dave@example.com
gws gmail +forward --message-id 18f1a2b3c4d --to dave@example.com --body 'FYI see below'
gws gmail +forward --message-id 18f1a2b3c4d --to dave@example.com --cc eve@example.com
gws gmail +forward --message-id 18f1a2b3c4d --to dave@example.com -a notes.pdf
```

## Tips

- Includes the original message with sender, date, subject, and recipients.
- With `--html`, the forwarded block preserves HTML formatting. Use fragment tags — no `<html>`/`<body>` wrapper needed.
- Inline images in the forwarded message (cid: references) will appear broken with `--html`. Externally hosted images are unaffected.
