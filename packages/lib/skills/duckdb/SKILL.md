---
name: duckdb
description: >-
  Analytical SQL queries on local files via DuckDB. Use for
  querying CSV, Parquet, JSON, and Excel files with SQL,
  aggregating data, joining datasets, and exporting results —
  all without a database server.
metadata:
  version: 1.0.0
  displayName: DuckDB
  author: gremlin
  category: data
  icon: database
  tags: [sql, data, analytics, csv, parquet, json]
  install: |
    which duckdb || pip install duckdb-cli
  allowedCommands:
    - duckdb
---

# DuckDB

You have access to `duckdb` for running SQL queries directly on files.

## Usage

```bash
# Interactive mode
duckdb

# Query a file directly
duckdb -c "SELECT * FROM 'data.csv' LIMIT 10"
duckdb -c "SELECT * FROM 'data.parquet'"
duckdb -c "SELECT * FROM read_json_auto('data.json')"

# Persist a database
duckdb mydb.duckdb -c "CREATE TABLE t AS SELECT * FROM 'data.csv'"
```

## Tips

- Query files directly without import: `SELECT * FROM 'file.csv'` — DuckDB auto-detects format.
- Glob patterns: `SELECT * FROM 'logs/*.csv'` to query multiple files at once.
- Remote files: `SELECT * FROM 'https://example.com/data.csv'` works out of the box.
- Export results: `COPY (SELECT ...) TO 'output.csv' (HEADER, DELIMITER ',')` or `.parquet`.
- Inspect schema: `DESCRIBE SELECT * FROM 'file.csv'`
- Summary stats: `SUMMARIZE SELECT * FROM 'file.csv'`
- Use `-json` flag for JSON output: `duckdb -json -c "SELECT ..."`
- Use `-markdown` flag for markdown table output.
- Use `-csv` flag for CSV output.
- DuckDB supports window functions, CTEs, `PIVOT`/`UNPIVOT`, `QUALIFY`, list/struct types, and regex.
- For large files, DuckDB streams and doesn't load everything into memory.
- Read Excel: `SELECT * FROM st_read('file.xlsx')` (requires `spatial` extension: `INSTALL spatial; LOAD spatial;`).
- Multiple statements: pipe a `.sql` file with `duckdb < queries.sql`.
