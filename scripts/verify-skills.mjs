import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const safePath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.includes("\\") &&
  value.split("/").every((part) => part && part !== "." && part !== "..");
async function filesIn(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      result.push(
        ...(await filesIn(join(directory, entry.name), relative + "/")),
      );
    else if (entry.isFile()) result.push(relative);
    else
      throw new Error(
        "Skill folders must contain ordinary files and directories.",
      );
  }
  return result.sort();
}
try {
  const lock = JSON.parse(
    await readFile(join(root, "agent-skills.lock.json"), "utf8"),
  );
  if (
    lock.schemaVersion !== 1 ||
    !Array.isArray(lock.sources) ||
    !lock.sources.length
  )
    throw new Error("Invalid skill lock file.");
  const names = new Set();
  let count = 0;
  for (const skill of lock.sources) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name) ||
      names.has(skill.name) ||
      !/^[0-9a-f]{40}$/.test(skill.commit) ||
      !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(skill.repository) ||
      !safePath(skill.sourcePath) ||
      !skill.files ||
      typeof skill.files !== "object"
    )
      throw new Error("Invalid pinned skill metadata.");
    names.add(skill.name);
    const directory = join(root, ".agents", "skills", skill.name);
    const listed = Object.keys(skill.files).sort();
    if (
      !listed.includes("SKILL.md") ||
      listed.some((path) => !safePath(path)) ||
      JSON.stringify(await filesIn(directory)) !== JSON.stringify(listed)
    )
      throw new Error(`Skill files changed: ${skill.name}`);
    for (const path of listed) {
      const text = (await readFile(join(directory, path), "utf8")).replaceAll(
        "\r\n",
        "\n",
      );
      const digest = createHash("sha256").update(text).digest("hex");
      if (digest !== skill.files[path])
        throw new Error(`Skill integrity mismatch: ${skill.name}/${path}`);
      count++;
    }
  }
  console.log(`Verified ${names.size} pinned skills (${count} files).`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Skill verification failed.",
  );
  process.exitCode = 1;
}
