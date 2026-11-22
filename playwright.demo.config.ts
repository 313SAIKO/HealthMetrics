import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "demo.spec.ts",
  metadata: { staticDemo: true },
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  use: { baseURL: "http://127.0.0.1:3102", trace: "retain-on-failure" },
  projects: [320, 1280].map((width) => ({
    name: `static-chromium-${width}`,
    use: { browserName: "chromium" as const, viewport: { width, height: 900 } },
  })),
  webServer: {
    command: "npm run preview:demo",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
