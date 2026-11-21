import { randomInt, randomUUID } from "node:crypto";
import {
  test as base,
  expect,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from "@playwright/test";
import type { HealthResult, UserProfile } from "../src/types";

interface Assessment {
  id: string;
  title: string;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
  result: HealthResult;
  formulaVersion: string;
}

interface AssessmentInput {
  title: string;
  measuredAt: string;
  profile: UserProfile;
}

const referenceProfile: UserProfile = {
  gender: "M",
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};

function input(title = "Baseline", measuredAt = "2026-11-19"): AssessmentInput {
  return { title, measuredAt, profile: { ...referenceProfile } };
}

function credentials() {
  const id = randomUUID();
  return {
    name: `Test ${id.slice(0, 8)}`,
    email: `healthmetrics-${id}@example.invalid`,
    password: `Test-${randomUUID()}-9a!`,
  };
}

// Reserved benchmarking addresses model independent clients without relaxing
// the production authentication rate limits in the isolated test server.
function clientAddress() {
  return `198.${randomInt(18, 20)}.${randomInt(0, 256)}.${randomInt(1, 255)}`;
}

async function expectDateFitsViewport(page: Page, testId: string) {
  const field = page.getByTestId(testId);
  await field.scrollIntoViewIfNeeded();
  expect(
    await field.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  const box = await field.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width + 0.5,
  );
}

async function expectStatus(response: APIResponse, status: number) {
  expect(response.status(), await response.text()).toBe(status);
}

async function register(api: APIRequestContext) {
  const account = credentials();
  const response = await api.post("/api/auth/sign-up/email", { data: account });
  expect(response.ok(), await response.text()).toBe(true);
  const sessionResponse = await api.get("/api/auth/get-session");
  await expectStatus(sessionResponse, 200);
  const session = await sessionResponse.json();
  expect(session.user.email).toBe(account.email);
  expect(session.session).toBeTruthy();
  return { ...account, id: session.user.id as string };
}

async function create(api: APIRequestContext, data = input()) {
  const response = await api.post("/api/assessments", { data });
  expect([200, 201], await response.text()).toContain(response.status());
  return (await response.json()) as Assessment;
}

const test = base.extend<{ api: APIRequestContext }>({
  api: async ({ playwright, baseURL }, runFixture) => {
    if (!baseURL) throw new Error("The full-stack tests require a baseURL.");
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
        "x-forwarded-for": clientAddress(),
      },
    });
    try {
      await runFixture(api);
    } finally {
      await api.dispose();
    }
  },
});

test.describe("assessment API", () => {
  test.beforeEach(({ baseURL }, testInfo) => {
    expect(baseURL).toBeTruthy();
    test.skip(
      testInfo.project.name !== "chromium-1280",
      "API contracts are independent of browser viewport.",
    );
  });

  test("requires a session for collection and individual record operations", async ({
    api,
  }) => {
    const path = "/api/assessments/00000000-0000-4000-8000-000000000000";
    for (const response of [
      await api.get("/api/assessments"),
      await api.post("/api/assessments", { data: input() }),
      await api.get(path),
      await api.patch(path, { data: input() }),
      await api.delete(path),
    ]) {
      await expectStatus(response, 401);
      expect((await response.json()).error.code).toBe("UNAUTHORIZED");
    }
  });

  test("signs in with a password and revokes a signed-out session", async ({
    api,
    playwright,
    baseURL,
  }) => {
    const account = await register(api);
    const oldState = await api.storageState();
    expect(oldState.cookies.some((cookie) => cookie.httpOnly)).toBe(true);
    await expectStatus(await api.post("/api/auth/sign-out", { data: {} }), 200);
    expect(await (await api.get("/api/auth/get-session")).json()).toBeNull();
    await expectStatus(await api.get("/api/assessments"), 401);

    const replay = await playwright.request.newContext({
      baseURL,
      storageState: oldState,
      extraHTTPHeaders: {
        Origin: baseURL!,
        "x-forwarded-for": clientAddress(),
      },
    });
    try {
      expect(
        await (await replay.get("/api/auth/get-session")).json(),
      ).toBeNull();
      await expectStatus(await replay.get("/api/assessments"), 401);
    } finally {
      await replay.dispose();
    }

    const invalid = await api.post("/api/auth/sign-in/email", {
      data: { email: account.email, password: `Wrong-${randomUUID()}` },
    });
    expect([400, 401]).toContain(invalid.status());
    expect(await (await api.get("/api/auth/get-session")).json()).toBeNull();
    const signedIn = await api.post("/api/auth/sign-in/email", {
      data: { email: account.email, password: account.password },
    });
    expect(signedIn.ok(), await signedIn.text()).toBe(true);
    const session = await (await api.get("/api/auth/get-session")).json();
    expect(session.user.id).toBe(account.id);
  });

  test("computes trusted snapshots and isolates each user's records", async ({
    api,
    playwright,
    baseURL,
  }) => {
    await register(api);
    const stranger = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL!,
        "x-forwarded-for": clientAddress(),
      },
    });
    try {
      const strangerAccount = await register(stranger);
      const spoof = await api.post("/api/assessments", {
        data: {
          ...input(),
          userId: strangerAccount.id,
          result: { bmi: 1, bmr: 1, tdee: 1 },
          formulaVersion: "client-supplied-version",
        },
      });
      await expectStatus(spoof, 400);
      const saved = await create(api);
      expect(saved.id).toEqual(expect.any(String));
      expect(saved.profile).toEqual(referenceProfile);
      expect(saved.result.bmi).toBeCloseTo(22.857142857);
      expect(saved.result.bmr).toBe(1648.75);
      expect(saved.result.tdee).toBe(1978.5);
      expect(saved.formulaVersion.length).toBeGreaterThan(0);
      expect(Number.isFinite(Date.parse(saved.createdAt))).toBe(true);
      expect(Number.isFinite(Date.parse(saved.updatedAt))).toBe(true);

      const path = `/api/assessments/${saved.id}`;
      await expectStatus(await stranger.get(path), 404);
      await expectStatus(
        await stranger.patch(path, { data: input("Hijacked") }),
        404,
      );
      await expectStatus(await stranger.delete(path), 404);
      const strangersList = await (
        await stranger.get("/api/assessments")
      ).json();
      expect(strangersList.total).toBe(0);

      const update: AssessmentInput = {
        title: "Updated measurement",
        measuredAt: "2026-11-20",
        profile: {
          gender: "F",
          age: 35,
          weight: 80,
          height: 165,
          activityMultiplier: 1.55,
        },
      };
      const patched = await api.patch(path, { data: update });
      await expectStatus(patched, 200);
      const edited = (await patched.json()) as Assessment;
      expect(edited.id).toBe(saved.id);
      expect(edited.createdAt).toBe(saved.createdAt);
      expect(edited.title).toBe(update.title);
      expect(edited.profile).toEqual(update.profile);
      expect(edited.result.bmr).toBe(1495.25);
      expect(edited.result.tdee).toBeCloseTo(2317.6375);
      const read = await api.get(path);
      await expectStatus(read, 200);
      expect(await read.json()).toEqual(edited);

      await expectStatus(
        await api.post("/api/assessments", {
          headers: { Origin: "https://untrusted.example.invalid" },
          data: input("Untrusted origin"),
        }),
        403,
      );
    } finally {
      await stranger.dispose();
    }
  });

  test("rejects malformed inputs and dates without changing saved data", async ({
    api,
  }) => {
    await register(api);
    const saved = await create(api, input("Leap day", "2024-02-29"));
    const invalidBodies: unknown[] = [
      null,
      [],
      { ...input(), title: " " },
      { ...input(), title: "x".repeat(121) },
      { ...input(), measuredAt: "2025-02-29" },
      { ...input(), measuredAt: "2026-13-01" },
      { ...input(), measuredAt: "2026-11-19T00:00:00Z" },
      { ...input(), profile: null },
      ...[
        { age: 19 },
        { age: 79 },
        { age: 30.5 },
        { weight: 19.9 },
        { weight: 300.1 },
        { height: 99.9 },
        { height: 220.1 },
        { activityMultiplier: 1.3 },
        { gender: "X" },
      ].map((change) => ({
        ...input(),
        profile: { ...referenceProfile, ...change },
      })),
    ];
    for (const data of invalidBodies) {
      const response = await api.post("/api/assessments", {
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(data),
      });
      await expectStatus(response, 400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    }
    await expectStatus(
      await api.post("/api/assessments", {
        headers: { "Content-Type": "application/json" },
        data: "{invalid-json",
      }),
      400,
    );
    await expectStatus(
      await api.patch(`/api/assessments/${saved.id}`, {
        data: { ...input(), measuredAt: "2026-02-30" },
      }),
      400,
    );
    for (const query of [
      "page=0",
      "page=1.5",
      "pageSize=101",
      "from=2025-02-29",
      "from=2026-11-21&to=2026-11-19",
    ]) {
      const response = await api.get(`/api/assessments?${query}`);
      await expectStatus(response, 400);
    }
    expect(
      await (await api.get(`/api/assessments/${saved.id}`)).json(),
    ).toEqual(saved);
    const list = await (await api.get("/api/assessments")).json();
    expect(list.total).toBe(1);
  });

  test("paginates, filters dates inclusively and permanently deletes a record", async ({
    api,
  }) => {
    await register(api);
    const first = await create(api, input("First", "2026-11-19"));
    const middle = await create(api, input("Middle", "2026-11-20"));
    const latest = await create(api, input("Latest", "2026-11-21"));
    const pageOne = await (
      await api.get("/api/assessments?page=1&pageSize=1")
    ).json();
    const pageTwo = await (
      await api.get("/api/assessments?page=2&pageSize=1")
    ).json();
    expect(pageOne).toMatchObject({ total: 3, page: 1, pageSize: 1 });
    expect(pageTwo).toMatchObject({ total: 3, page: 2, pageSize: 1 });
    expect(pageOne.items).toHaveLength(1);
    expect(pageTwo.items).toHaveLength(1);
    expect(pageOne.items[0].id).not.toBe(pageTwo.items[0].id);
    const filtered = await (
      await api.get("/api/assessments?from=2026-11-19&to=2026-11-20")
    ).json();
    expect(filtered.total).toBe(2);
    expect(filtered.items.map((item: Assessment) => item.id).sort()).toEqual(
      [first.id, middle.id].sort(),
    );
    const empty = await (
      await api.get("/api/assessments?from=2026-11-22&to=2026-11-23")
    ).json();
    expect(empty).toMatchObject({ total: 0, items: [] });
    await expectStatus(await api.delete(`/api/assessments/${middle.id}`), 204);
    await expectStatus(await api.get(`/api/assessments/${middle.id}`), 404);
    const remaining = await (await api.get("/api/assessments")).json();
    expect(remaining.total).toBe(2);
    expect(remaining.items.map((item: Assessment) => item.id).sort()).toEqual(
      [first.id, latest.id].sort(),
    );
  });
});

for (const language of ["th", "en"] as const) {
  test(`saves, reloads, compares, edits and deletes account history in ${language}`, async ({
    page,
    baseURL,
  }, testInfo) => {
    const account = credentials();
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.context().setExtraHTTPHeaders({
      "x-forwarded-for": clientAddress(),
    });
    await page.goto("/");
    if (language === "en")
      await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByTestId("auth-toggle")).toBeVisible();
    await page.getByTestId("auth-toggle").click();
    await page.getByTestId("auth-signup-mode").click();
    await page.getByTestId("auth-name").fill(account.name);
    await page.getByTestId("auth-email").fill(account.email);
    await page.getByTestId("auth-password").fill(account.password);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-signout")).toBeVisible();
    await page
      .getByRole("button", {
        name: language === "th" ? "คำนวณผลลัพธ์" : "Calculate my results",
        exact: true,
      })
      .click();
    const title = `${
      language === "th"
        ? "บันทึกติดตามสุขภาพ น้ำหนัก พลังงาน และกิจกรรมประจำวันหลังปรับพฤติกรรมเพื่อใช้เปรียบเทียบผลการคำนวณ"
        : "Morning health assessment after a week of walking, regular meals and rest, tracking weight and daily energy"
    } ${randomUUID()}`.slice(0, 120);
    await page.getByTestId("save-title").fill(title);
    await page.getByTestId("save-date").fill("2024-01-19");
    await expectDateFitsViewport(page, "save-date");
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/assessments") &&
        response.request().method() === "POST",
    );
    await page.getByTestId("save-assessment-submit").click();
    const response = await saveResponse;
    expect(response.ok(), await response.text()).toBe(true);
    const saved = (await response.json()) as Assessment;
    await expect(
      page.getByText(
        language === "th"
          ? "บันทึกผลลงในประวัติแล้ว"
          : "Assessment saved to your history.",
        { exact: true },
      ),
    ).toBeVisible();
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`calculator-saved-${language}.png`),
        fullPage: true,
      });
    const secondResponse = await page.request.post("/api/assessments", {
      headers: { Origin: baseURL! },
      data: {
        ...input("Follow-up", "2024-01-20"),
        profile: { ...referenceProfile, weight: 72 },
      },
    });
    expect(secondResponse.ok(), await secondResponse.text()).toBe(true);
    await page.goto(`/history?lang=${language}`);
    await expect(page.getByTestId("assessment-card")).toHaveCount(2);
    await page.reload();
    await expect(page.getByTestId("assessment-card")).toHaveCount(2);
    await page.getByTestId("filter-from").fill("2024-01-19");
    await page.getByTestId("filter-to").fill("2024-01-19");
    await expectDateFitsViewport(page, "filter-from");
    await expectDateFitsViewport(page, "filter-to");
    await page.getByTestId("filter-apply").click();
    await expect(page.getByTestId("assessment-card")).toHaveCount(1);
    await page.getByTestId("filter-clear").click();
    await expect(page.getByTestId("assessment-card")).toHaveCount(2);
    const baseline = page.locator(`[data-assessment-id="${saved.id}"]`);
    const followUp = page
      .getByTestId("assessment-card")
      .filter({ hasText: "Follow-up" });
    await expect(baseline).toContainText(title);
    await baseline.getByTestId("compare-select").check();
    await followUp.getByTestId("compare-select").check();
    const comparison = page.getByTestId("assessment-comparison");
    await expect(comparison).toBeVisible();
    await expect(comparison).toContainText(title);
    await expect(comparison).toContainText("Follow-up");
    await expect(
      comparison.getByTestId("comparison-record-first"),
    ).toContainText(title);
    for (const id of ["comparison-record-first", "comparison-record-second"])
      expect(
        await comparison
          .getByTestId(id)
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
    if (page.viewportSize()!.width < 640) {
      const mobile = comparison.getByTestId("comparison-mobile");
      await expect(mobile).toBeVisible();
      await expect(
        comparison.getByTestId("comparison-desktop"),
      ).not.toBeVisible();
      expect(
        await mobile.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      for (const metric of [
        { key: "weight", values: ["70", "72", "+2"] },
        { key: "tdee", values: ["1,978.5", "2,002.5", "+24"] },
      ]) {
        const row = mobile.locator(`[data-metric="${metric.key}"]`);
        await row.scrollIntoViewIfNeeded();
        for (const [index, testId] of [
          "comparison-first-value",
          "comparison-second-value",
          "comparison-difference",
        ].entries()) {
          const value = row.getByTestId(testId);
          await expect(value).toHaveText(metric.values[index]);
          await expect(value).toBeInViewport({ ratio: 1 });
          const box = await value.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(
            page.viewportSize()!.width + 0.5,
          );
        }
      }
    } else {
      await expect(comparison.getByTestId("comparison-desktop")).toBeVisible();
    }
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`history-comparison-${language}.png`),
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await baseline.getByTestId("edit-assessment").click();
    const edit = page.getByTestId("edit-assessment-form");
    await edit.getByTestId("edit-title").fill("Edited baseline");
    await edit.getByTestId("edit-weight").fill("71");
    await expectDateFitsViewport(page, "edit-date");
    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/assessments/${saved.id}`) &&
        response.request().method() === "PATCH",
    );
    await edit.getByTestId("edit-submit").click();
    const updated = await updateResponse;
    expect(updated.ok(), await updated.text()).toBe(true);
    expect(((await updated.json()) as Assessment).result.tdee).toBe(1990.5);
    await expect(baseline).toContainText("Edited baseline");
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`history-edited-${language}.png`),
        fullPage: true,
      });
    await baseline.getByTestId("delete-assessment").click();
    const deleteResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/assessments/${saved.id}`) &&
        response.request().method() === "DELETE",
    );
    await baseline.getByTestId("confirm-delete").click();
    expect((await deleteResponse).status()).toBe(204);
    await expect(baseline).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("assessment-card")).toHaveCount(1);
    await expect(followUp).toBeVisible();
    await page.getByTestId("auth-signout").click();
    await expect(page.getByTestId("auth-submit")).toBeVisible();
    await expect(page.getByTestId("auth-email")).toBeFocused();
    await page.reload();
    await expect(page.getByTestId("assessment-card")).toHaveCount(0);
    expect(failures).toEqual([]);
  });
}
