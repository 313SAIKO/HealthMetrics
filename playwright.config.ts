import { randomUUID, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
  projects: [320, 375, 1024, 1280].map((width) => ({
    name: `chromium-${width}`,
    use: { browserName: "chromium" as const, viewport: { width, height: 900 } },
  })),
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      DATABASE_PATH: join(tmpdir(), `healthmetrics-e2e-${randomUUID()}.sqlite`),
      BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
      BETTER_AUTH_URL: "http://127.0.0.1:3101",
    },
  },
});
