import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (!existsSync(".env.local")) {
  const template = readFileSync(".env.example", "utf8");
  writeFileSync(
    ".env.local",
    template.replace(
      "replace-with-a-random-secret-at-least-32-characters",
      randomBytes(48).toString("base64url"),
    ),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Created .env.local with a random auth secret. Existing configuration is never overwritten.",
  );
} else {
  console.log("Using existing .env.local.");
}
