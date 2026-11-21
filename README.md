# HealthMetrics

A Thai/English full-stack health assessment application built with Next.js, TypeScript, Better Auth and SQLite. Calculate adult health estimates without an account, then explicitly save measurements to a private account and compare saved snapshots.

## Quick start

Use Node **24.15.0 or newer within Node 24** (`.nvmrc`).

```sh
npm ci
npm run setup
npm run dev
```

Open http://localhost:3000. Setup creates an ignored `.env.local` with a random auth secret and initializes the database. It never overwrites an existing environment file. Create your own account from the account panel; no shared administrator or default password is installed.

Use the exact hostname configured in `BETTER_AUTH_URL`. If you change the port or use `127.0.0.1`, update that value and restart. Calculation remains available without an account. Profiles are sent to the backend only when saving a record or explicitly updating it.

## Features

- Adult BMI, resting energy, activity-adjusted TDEE and illustrative macro splits.
- Email/password registration, sign-in and database-backed sessions through Better Auth.
- Private SQL-backed assessment snapshots with measurement dates and formula versions.
- Paginated history with inclusive date filters; view, edit/recalculate and delete records.
- Select two assessments to compare their inputs and saved results with explicit units.
- Thai/English interface, responsive layouts, keyboard-friendly forms and error states.
- Server-side profile validation and recomputation, ownership-scoped queries and origin checks.

## Configuration

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_URL` | Exact application origin, e.g. `http://localhost:3000` locally; HTTPS on a public host. |
| `BETTER_AUTH_SECRET` | A random secret at least 32 characters long. Required in production. Keep it stable across restarts. |
| `DATABASE_PATH` | Persistent SQLite file. Default `./data/healthmetrics.sqlite`. |

`npm run db:migrate` applies auth and assessment migrations explicitly. Runtime initialization also ensures the schema exists before handling requests. Never commit `.env.local`, database files or database backups. Stop writes or use SQLite's backup API for a consistent backup; include WAL data when copying a live database.

## Development checks

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm audit
```

The standard check runs TypeScript, ESLint, Vitest, a production build and a guard against private environment/database files in deployment traces. Browser tests use an isolated temporary database and generated test accounts, covering Thai/English at 320, 375, 1024 and 1280 pixels. Full-stack tests check CRUD, validation, origin checks and isolation between two users. CI runs both suites.

## Supported use and product limits

This general information tool supports whole ages 20–78, weights 20–300 kg and heights 100–220 cm. These are product input limits, not clinical validation of every possible combination. It is not intended for children, pregnancy, breastfeeding, or personalized dietary treatment. Do not use its results to prescribe a diet.

BMI uses international adult boundaries 18.5, 25 and 30, without rounding before classification. Mifflin–St Jeor estimates resting energy; activity multipliers estimate TDEE. These are estimates, particularly for unusual body composition or medical conditions.

Ideal-weight formulas are displayed only for heights 152.4–220 cm. Hamwi uses the original sex-specific pound equation converted using 0.45359237 kg/lb. Devine, Robinson and Miller retain their published metric coefficients. Reference weights are not personal goals.

Macro distributions are illustrative calorie splits. Cutting subtracts 500 kcal and is withheld below 1,500 kcal/day or BMI 18.5. Bulking is also withheld for underweight users, who should obtain individualized advice. The 1,500 cutoff is a conservative product restriction, not a universal safe intake. Availability of a plan does not establish its suitability. Clinical review is required before expanding these features to nutrition treatment.

## References

- [CDC adult categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html)
- [CDC child and teen categories](https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html)
- [Original Mifflin–St Jeor study](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [Ideal-weight equations, Table 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC4841935/)
- [NIDDK Body Weight Planner and exclusions](https://www.niddk.nih.gov/bwp)

## Deployment

Build and run on a Node server with a persistent writable SQLite volume:

```sh
npm run build
npm start
```

Set production environment variables before starting. Use HTTPS on a public host and a persistent database path; do not deploy the SQLite file onto an ephemeral serverless filesystem. Run a single application instance against this file. Docker packaging is included:

```sh
docker build -t healthmetrics .
docker run --env-file .env.local -e BETTER_AUTH_URL=https://your-domain.example -e DATABASE_PATH=/app/data/healthmetrics.sqlite -p 3000:3000 -v healthmetrics-data:/app/data healthmetrics
```

The container runs as the unprivileged Node user. Put a TLS reverse proxy in front of it. Configure that proxy to sanitize and set `X-Forwarded-For`; do not accept arbitrary client-supplied forwarding headers, because authentication rate limits use the client IP. Keep the auth secret and database volume across releases. This repository does not provision a cloud host or public domain.

## Portfolio walkthrough

1. Create an account, calculate a profile and save it with a measurement date.
2. Save a second assessment with different input, then reload the history page.
3. Compare the two records, edit one and observe its recomputed snapshot.
4. Sign out and show that the history requires sign-in.
5. Explain the shared calculation core, server validation, database schema and cross-user authorization tests.

Use fictional measurements for a recorded presentation and identify them as examples. See [architecture and design decisions](docs/architecture.md) and [API contract](docs/api.md). Email verification and password recovery require a mail service and are outside this release; email is currently a sign-in identifier, not a verified identity.

BMI display uses a less-than sign near category boundaries when rounding would otherwise cross the boundary. Classification and plan availability always use the unrounded value. Product limits are centralized in `src/core/policy.ts`.

## Screenshots

These current production-build screenshots use a fictional presentation account and example measurements in an isolated temporary database:

- Calculator: [desktop](docs/screenshots/calculator-desktop-th.png) · [mobile](docs/screenshots/calculator-mobile-th.png)
- History and comparison: [desktop](docs/screenshots/history-desktop-th.png) · [mobile](docs/screenshots/history-mobile-th.png)

## Agent development guidance

Four project-scoped, commit-pinned skills support React, Better Auth and UX/UI work. See [selection, application and verification](docs/agent-skills.md). `AGENTS.md` routes relevant tasks; `npm run verify:skills` checks source integrity and is included in the standard checks.
