# Contributing to OpenGremlin

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo and clone your fork
2. Follow the setup instructions in [DEVELOPMENT.md](DEVELOPMENT.md)
3. Create a branch for your change

## Before Submitting a PR

- Run the linter: `pnpm lint`
- Fix lint issues: `pnpm lint:fix`
- Typecheck the server: `cd apps/server && pnpm exec tsc --noEmit`
- Typecheck the mobile app: `cd apps/mobile && npx tsc --noEmit`
- Regenerate GraphQL types: `pnpm --filter @opengremlin/mobile codegen`
- Run tests: `pnpm --filter @opengremlin/server test`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Write a clear description of what changed and why
- Make sure linting and typechecks pass

## Reporting Issues

Use the issue templates for bug reports and feature requests.

## License

By contributing, you agree that your contributions will be licensed under the [MIT license](LICENSE).
