import { readdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = join(projectRoot, ".next");

async function traceManifests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const manifests = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) manifests.push(...(await traceManifests(path)));
    else if (entry.isFile() && entry.name.endsWith(".nft.json"))
      manifests.push(path);
  }
  return manifests;
}

function privateProjectFile(path) {
  const local = relative(projectRoot, path);
  if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`))
    return false;
  const parts = local.split(sep);
  if (parts.includes("node_modules")) return false;
  const rootEnvironment =
    parts.length === 1 &&
    parts[0].startsWith(".env") &&
    parts[0] !== ".env.example";
  return (
    rootEnvironment ||
    /\.(?:sqlite3?|db)(?:-(?:wal|shm|journal))?$/i.test(parts.at(-1) ?? "")
  );
}

try {
  const manifests = await traceManifests(buildRoot);
  if (!manifests.length)
    throw new Error("No build trace manifests found. Run npm run build first.");
  const violations = new Set();
  for (const manifest of manifests) {
    let trace;
    try {
      trace = JSON.parse(await readFile(manifest, "utf8"));
    } catch {
      throw new Error(`Cannot read build trace: ${relative(projectRoot, manifest)}`);
    }
    if (
      !trace ||
      typeof trace !== "object" ||
      !Array.isArray(trace.files) ||
      trace.files.some((file) => typeof file !== "string")
    ) {
      throw new Error(
        `Invalid build trace: ${relative(projectRoot, manifest)}`,
      );
    }
    for (const file of trace.files) {
      const path = resolve(dirname(manifest), file);
      if (privateProjectFile(path))
        violations.add(
          `${relative(projectRoot, manifest)} -> ${relative(projectRoot, path)}`,
        );
    }
  }
  if (violations.size) {
    console.error("Build traces reference private project files:");
    for (const violation of [...violations].sort())
      console.error(`- ${violation}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Verified ${manifests.length} build traces: no private environment or SQLite files referenced.`,
    );
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Build trace verification failed.",
  );
  process.exitCode = 1;
}
