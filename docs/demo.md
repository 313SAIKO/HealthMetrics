# Public portfolio demo

Live URL: [HealthMetrics demo](https://healthmetrics-demo-313saiko.fitbroth256.chatgpt.site) · [English](https://healthmetrics-demo-313saiko.fitbroth256.chatgpt.site?lang=en).

The public demo uses the same `DemoWorkspace`, calculation core and result/comparison components as `/demo` in the full application. It starts with five clearly fictional assessment snapshots and selects two for immediate comparison. Visitors can calculate, add, edit, delete, filter and compare sample records without signing up.

## Data boundary

Demo changes live only in React state. Reloading or pressing Reset restores the fixtures; neither storage nor account APIs are used. The static bundle contains no server, Better Auth, session provider or SQLite runtime. Its CSP disables outgoing connections. It cannot read or modify private assessment data.

The full Next.js application retains its authenticated SQL-backed history. Serving the public demo does not deploy that server onto an ephemeral filesystem or change ownership checks.

## Build and verify

```sh
npm run build:demo
npm run test:demo
```

`dist/` is generated and ignored. The build includes only HTML, browser JavaScript/CSS, self-hosted fonts and license notices. The ignored `.demo-build-meta.json` records module inputs for inspection. Source maps, configuration, runtime secrets, `.next` and database files must never enter the public artifact.

The static browser suite exercises the distributed artifact in Thai and English at mobile and desktop widths and fails on every API request. The full `npm run test:e2e` suite separately exercises `/demo` alongside authenticated workflows. CI runs both.

## Publishing

The root `.openai/hosting.json` identifies the existing Sites demo and declares `dist` as its static output. Reuse that project ID. The ignored `.site-publish/healthmetrics-demo` checkout is a separate Sites source repository containing **only the compiled distribution and hosting manifest**; the application source stays in the main GitHub repository. Publish a frozen, verified archive from the exact pushed Sites commit using the Sites workflow. Never copy the main checkout, credentials, `.env` or databases into it.

## Presenting the project

Explain that the public experience demonstrates the interface with fictional browser-local data. The main application also implements accounts, server-side validation/recomputation, owned SQL records and revocable sessions, which are independently tested. Do not describe the public static demo as running those backend services.
