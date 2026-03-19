# Profiling

Capture Chrome DevTools performance profiles during browser automation.

## Basic Profiling

```bash
agent-browser profiler start

# Perform actions to profile
agent-browser open https://example.com
agent-browser wait --load networkidle

agent-browser profiler stop ./trace.json
```

## Custom Trace Categories

```bash
agent-browser profiler start --categories "devtools.timeline,v8.execute,blink,blink.user_timing"
```

Default categories: `devtools.timeline`, `v8.execute`, `blink`, `blink.user_timing`.

## Use Cases

### Diagnose Slow Page Loads

```bash
agent-browser profiler start
agent-browser open https://slow-site.com
agent-browser wait --load networkidle
agent-browser profiler stop ./page-load-trace.json
```

### Profile User Interactions

```bash
agent-browser open https://app.example.com
agent-browser wait --load networkidle
agent-browser snapshot -i

agent-browser profiler start
agent-browser click @e1  # Profile the click handler
agent-browser wait --load networkidle
agent-browser profiler stop ./click-trace.json
```

### CI/CD Performance Regression

```bash
#!/bin/bash
agent-browser profiler start
agent-browser open https://staging.example.com
agent-browser wait --load networkidle
agent-browser profiler stop ./ci-trace.json

# Parse and check thresholds
# ...
```

## Viewing Traces

The output is a JSON file in Chrome Trace Event format. View with:
- **Chrome DevTools**: Performance tab > Load profile
- **Perfetto UI**: https://ui.perfetto.dev
- **chrome://tracing**: Built-in Chrome trace viewer

## Limitations

- Only works with Chromium-based browsers
- 5 million event memory cap
- Data collection on stop has a 30-second timeout
