# sheets +append

Append rows to a spreadsheet.

## Usage

```bash
gws sheets +append --spreadsheet <ID> --values <CSV>
gws sheets +append --spreadsheet <ID> --json-values <JSON>
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--spreadsheet` | Yes | — | Spreadsheet ID |
| `--values` | — | — | Comma-separated values for a single row |
| `--json-values` | — | — | JSON array of rows, e.g. `'[["a","b"],["c","d"]]'` |

## Examples

```bash
# Single row
gws sheets +append --spreadsheet SHEET_ID --values 'Alice,100,true'

# Multiple rows
gws sheets +append --spreadsheet SHEET_ID --json-values '[["Alice",100],["Bob",200]]'
```

## Tips

- Use `--values` for simple single-row appends.
- Use `--json-values` for bulk multi-row inserts.
