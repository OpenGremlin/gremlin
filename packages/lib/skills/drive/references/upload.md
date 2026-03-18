# drive +upload

Upload a file to Google Drive with automatic metadata detection.

## Usage

```bash
gws drive +upload <file>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `<file>` | Yes | — | Path to file to upload |
| `--parent` | — | — | Parent folder ID |
| `--name` | — | — | Target filename (defaults to source filename) |

## Examples

```bash
# Upload to root
gws drive +upload ./report.pdf

# Upload to a specific folder
gws drive +upload ./report.pdf --parent FOLDER_ID

# Upload with a custom name
gws drive +upload ./data.csv --name 'Sales Data.csv'
```

## Tips

- MIME type is detected automatically from the file extension.
- Filename is inferred from the local path unless `--name` is given.
