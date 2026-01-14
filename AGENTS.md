# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the SvelteKit app. Route files live under `src/routes/` using `+page.svelte` and `+page.server.ts` conventions. Shared UI and utilities live under `src/lib/` (`components/`, `server/`, `utils.ts`).
- `drizzle/` holds SQL migrations and `drizzle/schema.ts` defines the database schema.
- `static/` contains static assets (e.g., `robots.txt`, icons).
- `scripts/` includes one-off utilities (e.g., migration helpers).
- Root config files include `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, and `playwright.config.ts`.

## Build, Test, and Development Commands

- `bun run dev`: start the Vite dev server.
- `bun run build`: build the production bundle.
- `bun run preview`: preview the production build locally.
- `bun run start`: run the built Node server (`build/index.js`).
- `bun run check` / `bun run check:watch`: run Svelte type checking.
- `bun run lint`: run Prettier check and ESLint.
- `bun run format`: format the codebase with Prettier.
- `bun run test:unit`: run Vitest unit tests.
- `bun run test:e2e`: run Playwright e2e tests.
- `bun run db:start`, `bun run db:migrate`: start Postgres via Docker Compose and run migrations.

## Coding Style & Naming Conventions

- Formatting is enforced by Prettier (2-space indentation); linting is enforced by ESLint. A lefthook pre-commit hook formats staged files.
- Use SvelteKit conventions: `+page.svelte`, `+page.server.ts`, `+layout.svelte`.
- Use PascalCase for reusable Svelte components in `src/lib/components/` (e.g., `OrderForm.svelte`).
- Use kebab-case for route folders (e.g., `src/routes/opt-in/`).

## Testing Guidelines

- Unit tests use Vitest with separate client/server projects. Client tests target `src/**/*.svelte.{test,spec}.{js,ts}`; server tests target `src/**/*.{test,spec}.{js,ts}`.
- E2E tests run with Playwright (`e2e/` directory) against `bun run build && bun run preview` on port 4173.
- No explicit coverage target is configured; add tests for new behavior and bug fixes.

## Commit & Pull Request Guidelines

- Commit messages are short, imperative, and task-focused (e.g., “Fix token list refresh”, “npm updates”).
- PRs should include a brief description, testing notes, and screenshots for UI changes. Link related issues when applicable.

## Configuration & Secrets

- Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and optional OAuth credentials.
- Never commit real secrets; use `.env.example` for defaults.
