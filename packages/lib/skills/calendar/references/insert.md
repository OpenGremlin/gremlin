# calendar +insert

Create a new calendar event.

## Usage

```bash
gws calendar +insert --summary <TEXT> --start <TIME> --end <TIME>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--summary` | Yes | — | Event title |
| `--start` | Yes | — | Start time (ISO 8601, e.g. 2026-06-17T09:00:00-07:00) |
| `--end` | Yes | — | End time (ISO 8601) |
| `--calendar` | — | primary | Calendar ID |
| `--location` | — | — | Event location |
| `--description` | — | — | Event description/body |
| `--attendee` | — | — | Attendee email (repeatable) |
| `--meet` | — | — | Add a Google Meet video conference link |

## Examples

```bash
# Simple event
gws calendar +insert --summary 'Standup' --start '2026-06-17T09:00:00-07:00' --end '2026-06-17T09:30:00-07:00'

# With attendees
gws calendar +insert --summary 'Review' --start '2026-06-17T14:00:00-07:00' --end '2026-06-17T15:00:00-07:00' --attendee alice@example.com --attendee bob@example.com

# With Google Meet
gws calendar +insert --summary 'Remote Sync' --start '2026-06-17T10:00:00-07:00' --end '2026-06-17T10:30:00-07:00' --meet
```

## Tips

- Use RFC 3339 format for times (e.g. `2026-06-17T09:00:00-07:00`).
- The `--meet` flag automatically generates a Google Meet link.
- Use `--attendee` multiple times to add several attendees.
