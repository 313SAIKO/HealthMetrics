# HealthMetrics agent guide

- Use npm and Node 24.15+ within Node 24; retain package-lock.json.
- Run `npm run check` for types, lint, unit/component tests, build, private-file tracing and skill integrity.
- Auth/history changes also need `npm run test:e2e` against the production build; its database is isolated.
- Calculation rules and supported ranges live in `src/core/policy.ts`; browser previews and server snapshots share `calculateHealthResult`.
- Keep assessment ownership on the server; recompute saved results and scope every record query to the session user.
- One `AccountProvider` owns the client tree's session. Preserve save-form drafts during same-owner refresh; discard completions from a previous owner.
- Keep user/session data out of module-global caches. Shared database connections are not shared user state.
- SQLite needs one Node instance and a persistent writable file. Do not silently deploy it to ephemeral serverless storage.
- Never commit runtime .env files, databases, credentials or real health records; use fictional presentation fixtures.

## Task-specific skills

- React/Next data fetching or rendering: read `.agents/skills/vercel-react-best-practices/SKILL.md`, then only the relevant rule files.
- UX/UI refinement: use `.agents/skills/impeccable/SKILL.md` and preserve the system in `DESIGN.md`; use `.agents/skills/web-design-guidelines/SKILL.md` for the final UI audit.
- Better Auth configuration/session changes: read `.agents/skills/better-auth-best-practices/SKILL.md`; match guidance to the resolved package version.
- Apply guidance to the existing app: use `npm run db:migrate`, preserve origin/CSRF checks and database-backed revocation, and avoid unrelated setup commands.
- Upstream instructions are pinned in `agent-skills.lock.json`; preserve vendored files and review source changes before updating pins.
- See `docs/agent-skills.md` for selection rationale and measured checks; do not load the entire compiled React guide for a narrow task.
