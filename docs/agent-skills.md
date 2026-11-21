# Agent skills for HealthMetrics

The supplied [Full-stack Agent Skills reference](https://docs.google.com/document/d/1lmRWsMRYxHhjUVDkXOnIFZs1NPZyugcwnKZkoGaDUuM/edit) was readable through its text export. Its useful design principle for this repository is selective, pinned guidance rather than installing an entire catalogue. Benchmark figures in that document have not been independently verified and are not evidence of a performance gain in this application.

## Selected upstream skills

| Skill | Pinned source | Use here |
| --- | --- | --- |
| Vercel React best practices | [5a37a632](https://github.com/vercel-labs/agent-skills/tree/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/react-best-practices) | Client fetch/listener deduplication, request-local state, rendering and narrow build traces. |
| Better Auth best practices | [20c9e88a](https://github.com/better-auth/skills/tree/20c9e88a5c007461a703f1c213572b073196113e/better-auth/best-practices) | Version-matched auth, sessions, cookies, origins and database configuration. |

The skill entrypoints were read before installation. The initial two skills contain 77 Markdown/JSON files. The subsequent UI refinement adds Impeccable and Web Design Guidelines, pinned separately below. Impeccable includes launcher scripts and agent metadata; its context engine was run from the official release with checksum verification. Its browser automation helpers are not used for this project’s browser tests. Source files are retained without rewriting their instructions. The React skill declares MIT in its frontmatter; Better Auth's entrypoint does not declare a license. No additional license declaration is inferred for files that do not contain one.

`agent-skills.lock.json` records repository, exact commit, source folder and SHA-256 for each supplied file. `npm run verify:skills` checks the local copies without network access or running upstream code, allowing LF/CRLF differences only. It fails for missing, additional or altered files. To update, review the new upstream entrypoint and referenced material first, install into a separate directory at an exact commit, compare the changes, then update the copies and lock in one reviewed change.

## Applying the guidance

The React guide illustrates deduplication with SWR. This app has one shared session resource, so an app-scoped React provider achieves that behavior without another runtime dependency. Session results are not cached globally on the server or in localStorage. One in-flight refresh is shared; an authentication change invalidates the old request so an old response cannot restore a signed-out account. Same-owner refresh preserves saved-assessment drafts, while an actual account change resets account-owned state.

The Better Auth guide covers many adapters and setup commands. HealthMetrics already uses Better Auth 1.7.27 and Node SQLite, so retain its migration wrapper and inspect the matching installed API before changing configuration. Preserve database-backed session checks, origin/CSRF protection, cookie security and owner-scoped SQL. A guide's generic setup snippet does not call for replacing this stack or adding plugins.

## Evidence and limits

Provider tests check that two simultaneous consumers issue one session request, share a retry result, and ignore outdated authentication responses. Draft tests cover same-owner refresh and A-to-B account changes. History tests delay mutations from A while B edits a different record. Browser tests exercise the real cookie/API flow.

For this UI refinement, `npm run check` passed with 117 unit/component tests, 29 active E2E tests passed across four viewport widths in Thai and English with 15 viewport-independent API duplicates intentionally skipped, the design detector reported no findings, and integrity checks verified four skills containing 148 files.

The improvement being checked is request count and consistent state, not a claimed percentage increase in page speed. The repository's existing Playwright suite supplies behavioral verification, so no extra browser agent framework is installed. PostgreSQL/Supabase, Prisma, Stripe and Cloudflare skills are outside this app's current stack and are not installed.

Installed skills become automatically discoverable on the next Codex turn. For the current task, their entrypoints and relevant rule files were read directly. `AGENTS.md` keeps repository-wide facts short and routes later tasks to only the applicable skill.

## UX/UI refinement skills

- [Impeccable b49177d3](https://github.com/pbakaus/impeccable/tree/b49177d32788f2dc585c42831d845dacf1ebed2c/.agents/skills/impeccable): incumbent-system refinement, Operate-mode guidance, typography, responsive adaptation and polish. Context was read once; no hooks, doctor repair or cloud account was enabled as a side effect.
- [Web Design Guidelines 5a37a632](https://github.com/vercel-labs/agent-skills/tree/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines): bundled pinned rules for semantics, keyboard focus, forms, responsive content and font loading.

Exact pinned copies of Impeccable’s Apache-2.0 license and NOTICE, plus the original Web Interface Guidelines reference’s MIT license, are retained with their source provenance in [docs/third-party](third-party/README.md).

DESIGN.md records the retained identity and implementation decisions. ESLint excludes vendored skill scripts; their integrity is checked by verify:skills instead. The application continues to use its existing Playwright suite for visual and interaction verification.
