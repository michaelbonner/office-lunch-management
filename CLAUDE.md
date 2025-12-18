# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Office Lunch Management - A SvelteKit application for managing office lunch orders with multi-organization support. Built with Svelte 5, Better Auth for authentication, Drizzle ORM with PostgreSQL, and Tailwind CSS v4.

## Common Commands

### Development

```bash
bun run dev              # Start development server
bun run dev -- --open    # Start dev server and open browser
```

### Testing

```bash
bun run test:unit        # Run Vitest unit tests
bun run test:e2e         # Run Playwright e2e tests
bun run test             # Run both unit and e2e tests
bun run check            # Run svelte-check for type checking
bun run check:watch      # Run svelte-check in watch mode
```

### Database

```bash
bun run db:start         # Start PostgreSQL via Docker Compose
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run database migrations
bun run db:studio        # Open Drizzle Studio
```

### Build & Deploy

```bash
bun run build            # Build for production
bun run preview          # Preview production build locally
bun run start            # Start production server (node build/index.js)
```

### Code Quality

```bash
bun run lint             # Run Prettier and ESLint checks
bun run format           # Format code with Prettier
```

## Architecture

### Authentication & Authorization

- **Better Auth** (`src/lib/auth.ts`) - Central auth configuration with GitHub/Google OAuth providers
- **Multi-organization support** - Users automatically get an organization created on signup
- **Domain-restricted signup** - Email signup restricted to `bootpackdigital.com` and `blackthornsoftware.com` domains
- **Role-based access**:
  - Organization roles: `owner`, `admin`, `member` (in `member` table)
  - System admin: `role` field in `user` table
- **Server hooks** (`src/hooks.server.ts`) - Session/user data attached to `event.locals` on every request
- **Auth client** (`src/lib/auth-client.ts`) - Client-side auth utilities

### Database Schema

Located in `drizzle/schema.ts`. Core tables:

- **user** - Users with Better Auth fields plus `role` (system admin), `banned`, `banReason`, `banExpires`
- **organization** - Organizations with `slug`, `name`, `logo`, `metadata`
- **member** - User-organization relationships with `role` (owner/admin/member)
- **restaurant** - Restaurants with `name` and `menuLink`
- **order** - User orders with `userId`, `restaurantId`, `orderDetails` (unique constraint on user+restaurant)
- **opt_in** - Date-specific opt-ins with `userId`, `organizationId`, `optInDate` (unique constraint on all three)
- **session, account, verification, invitation** - Better Auth tables

Database connection: `src/lib/server/db/index.ts` uses `drizzle-orm/postgres-js` with the full schema imported.

### Organization System

File: `src/lib/server/organization.ts`

Key patterns:

- Organizations auto-created on user signup with slug format: `{email-domain}-{userId-prefix}`
- All org queries use raw SQL via `db.execute()` for complex joins
- Helper functions: `getUserOrganizations()`, `isUserAdmin()`, `isUserSystemAdmin()`, `getUsersInSameOrganizations()`, `getAllOrganizationsWithMembers()`
- Admin access control: Users are admins if they have `admin` or `owner` role in ANY organization

### Opt-In System

File: `src/lib/server/opt-in.ts`

- Date-based opt-ins stored as YYYY-MM-DD strings
- Default timezone: `America/Denver`
- Key functions: `optUserIn()`, `optUserOut()`, `isUserOptedIn()`, `getOptedInUsers()`, `getNotOptedInUsers()`
- Admin functions: `adminOptUserIn()`, `adminOptUserOut()` - Allow admins to opt users in/out on their behalf
- Opt-ins are per-organization but typically created for all user's organizations at once
- **Important**: Users must explicitly opt in to appear in the lunch ordering system

### Route Structure

- `/` - Home/landing page
- `/orders` - User order submission
- `/opt-in/success` - Opt-in confirmation page
- `/admin/*` - Admin routes (protected by `isUserAdmin()` check):
  - `/admin` - Restaurant management
  - `/admin/orders` - View/manage all orders
  - `/admin/user-orders` - User-specific order views
  - `/admin/organizations` - Organization management (system admin only)

### API Routes

All in `src/routes/api/`:

- `/api/orders` - Create/manage orders
- `/api/restaurants` - Restaurant CRUD
- `/api/opt-in` - Opt-in functionality
- `/api/admin/*` - Admin-only endpoints for users, orders, organizations, opt-ins

### Testing Setup

**Vitest** (`vite.config.ts`):

- Two test projects: `client` (browser/Svelte) and `server` (Node)
- Client tests: `**/*.svelte.{test,spec}.{js,ts}` run in Playwright browser
- Server tests: `**/*.{test,spec}.{js,ts}` (excluding Svelte tests) run in Node
- Client setup file: `vitest-setup-client.ts`

**Playwright** (`playwright.config.ts`):

- E2E tests in `e2e/` directory
- Runs against production build on port 4173
- Test environment requires `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` env vars

## Development Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` (default for local: `postgres://root:mysecretpassword@localhost:5432/local`)
   - `BETTER_AUTH_SECRET` (generate a random 32+ character string)
   - OAuth credentials for GitHub/Google (optional)

2. Start PostgreSQL: `bun run db:start`

3. Run migrations: `bun run db:push` or `bun run db:migrate`

4. Start dev server: `bun run dev`

## Key Patterns

### Authorization Checks

Always check `locals.user` in `+page.server.ts` files. Use `isUserAdmin()` or `isUserSystemAdmin()` from `src/lib/server/organization.ts` for admin routes.

### Database Queries

- Simple queries: Use Drizzle query builder (`db.select()`, `db.insert()`, etc.)
- Complex queries (joins, subqueries): Use raw SQL via `db.execute<TypeHere>(sql`...`)`
- Always type the result of `db.execute()` with the expected shape

### Form Components

Svelte components in `src/lib/components/`: `OrderForm.svelte`, `RestaurantForm.svelte`, `UserForm.svelte`. These handle form state and submission to API routes.

### Deployment

Built for Node.js deployment with `@sveltejs/adapter-node`. Configuration in `svelte.config.js` specifies `out: 'build'` directory.
