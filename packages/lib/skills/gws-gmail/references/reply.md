# gmail +reply / +reply-all

Reply to a message. Threading is handled automatically.

## Usage

```bash
gws gmail +reply --message-id <ID> --body <TEXT>
gws gmail +reply-all --message-id <ID> --body <TEXT>
```

Use `+reply` for single-recipient replies. Use `+reply-all` to reply to all original To/CC recipients.

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--message-id` | Yes | — | Gmail message ID to reply to |
| `--body` | Yes | — | Reply body (plain text, or HTML with --html) |
| `--from` | — | — | Sender address (for send-as/alias) |
| `--to` | — | — | Additional To email(s), comma-separated |
| `--cc` | — | — | CC email(s), comma-separated |
| `--bcc` | — | — | BCC email(s), comma-separated |
| `--html` | — | — | Treat --body as HTML content |
| `-a`, `--attach` | — | — | Attach a file (repeatable) |
| `--dry-run` | — | — | Preview without executing |

### +reply-all only

| Flag | Description |
|------|-------------|
| `--remove` | Exclude recipients from the reply (comma-separated emails) |

## Examples

```bash
# Simple reply
gws gmail +reply --message-id 18f1a2b3c4d --body 'Thanks, got it!'

# Reply with CC
gws gmail +reply --message-id 18f1a2b3c4d --body 'Looping in Carol' --cc carol@example.com

# Reply-all
gws gmail +reply-all --message-id 18f1a2b3c4d --body 'Sounds good to me!'

# Reply-all excluding someone
gws gmail +reply-all --message-id 18f1a2b3c4d --body 'Updated' --remove bob@example.com

# Reply with attachment
gws gmail +reply --message-id 18f1a2b3c4d --body 'Updated version' -a updated.docx
```

## Tips

- Automatically sets In-Reply-To, References, and threadId headers.
- Quotes the original message in the reply body.
- With `--html`, the quoted block uses Gmail's gmail_quote CSS classes. Use fragment tags — no `<html>`/`<body>` wrapper needed.
- Inline images in quoted messages (cid: references) will appear broken with `--html`. Externally hosted images are unaffected.
