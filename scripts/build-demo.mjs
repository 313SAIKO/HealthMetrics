import { build } from "esbuild";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
// Delete only this project's dedicated generated demo directory.
if (dirname(output) !== root || output !== join(root, "dist"))
  throw new Error("Invalid demo output path.");
await rm(output, { recursive: true, force: true });
await mkdir(join(output, "assets"), { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/demo/entry.tsx"],
  outdir: "dist/assets",
  entryNames: "demo-[hash]",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: ["es2020"],
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  metafile: true,
  legalComments: "linked",
  define: { "process.env.NODE_ENV": '"production"' },
});
const forbidden = Object.keys(result.metafile.inputs).filter((name) =>
  /(?:^|[/\\])(?:server|api)(?:[/\\])|better-auth|node:sqlite|node:fs|node:crypto|next[/\\]/.test(
    name,
  ),
);
if (forbidden.length)
  throw new Error(
    `Server-only code entered demo bundle: ${forbidden.join(", ")}`,
  );
await writeFile(
  join(root, ".demo-build-meta.json"),
  JSON.stringify(result.metafile, null, 2),
);
execFileSync(
  process.execPath,
  [
    join(root, "node_modules/tailwindcss/lib/cli.js"),
    "-i",
    "src/app/globals.css",
    "-o",
    "dist/assets/styles.css",
    "--minify",
  ],
  { cwd: root, stdio: "inherit" },
);
await cp(join(root, "public/fonts"), join(output, "fonts"), {
  recursive: true,
});
await mkdir(join(output, "licenses"), { recursive: true });
for (const name of ["react", "react-dom", "scheduler"]) {
  await cp(
    join(root, "node_modules", name, "LICENSE"),
    join(output, "licenses", `${name}.txt`),
  );
}
const app = (await readdir(join(output, "assets"))).find((name) =>
  /^demo-.*\.js$/.test(name),
);
if (!app) throw new Error("Demo bundle not generated.");
await writeFile(
  join(output, "index.html"),
  `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f4f7f6"><meta name="description" content="Try HealthMetrics with fictional assessment history. No account required. Thai and English portfolio demo.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>HealthMetrics — Interactive Portfolio Demo</title>
<link rel="preload" href="/fonts/noto-sans-thai-thai.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/noto-sans-thai-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css"></head><body><div id="root"></div><noscript>This interactive demo needs JavaScript. It uses fictional data and does not require an account.</noscript><script type="module" src="/assets/${app}"></script></body></html>`,
);
const files = [];
async function list(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await list(path);
    else files.push(path);
  }
}
await list(output);
const allowed =
  /(?:[/\\])(?:index\.html|assets[/\\][a-zA-Z0-9._-]+\.(?:js|css|txt)|fonts[/\\][a-zA-Z0-9._-]+\.(?:woff2|txt)|licenses[/\\][a-zA-Z0-9._-]+\.txt)$/;
if (files.some((path) => !allowed.test(path)))
  throw new Error("Unexpected file in demo artifact.");
console.log(
  `Built static demo with ${Object.keys(result.metafile.inputs).length} browser inputs and ${files.length} public files. No API, auth or database runtime is included.`,
);
