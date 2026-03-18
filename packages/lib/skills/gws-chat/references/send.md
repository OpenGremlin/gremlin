# chat +send

Send a plain text message to a Google Chat space.

## Usage

```bash
gws chat +send --space <NAME> --text <TEXT>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--space` | Yes | — | Space name (e.g. `spaces/AAAAxxxx`) |
| `--text` | Yes | — | Message text (plain text) |

## Examples

```bash
gws chat +send --space spaces/AAAAxxxx --text 'Hello team!'
gws chat +send --space spaces/AAAAxxxx --text 'Deploy complete ✓'
```

## Tips

- Use `gws chat spaces list` to find space names.
- For cards or threaded replies, use the raw API instead.
