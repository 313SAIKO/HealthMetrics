import { test, expect } from "@playwright/test";
import { createDemoAssessments } from "../src/demo/fixtures";
import { calculateHealthResult } from "../src/core/assessment";
import { getTranslations } from "../src/utils/translations";

for (const language of ["th", "en"] as const) {
  test(`uses public fictional history and a local calculator without API mutations in ${language}`, async ({
    page,
  }, testInfo) => {
    const staticDemo = testInfo.config.metadata.staticDemo === true;
    const demoPath = staticDemo ? "/" : "/demo";
    const failures: string[] = [];
    const forbiddenApiRequests: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (
        !staticDemo &&
        request.method() === "GET" &&
        path === "/api/auth/get-session"
      ) {
        await route.continue();
        return;
      }
      forbiddenApiRequests.push(`${request.method()} ${path}`);
      await route.abort();
    });
    const fixtures = createDemoAssessments(language);
    const baseline = fixtures.find((record) => record.id === "demo-baseline")!;
    const followUp = fixtures.find((record) => record.id === "demo-follow-up")!;
    const other = fixtures.find((record) => record.id === "demo-october-late")!;
    const cards = page.getByTestId("demo-record");
    const card = (id: string) => page.locator(`[data-demo-id="${id}"]`);
    const comparison = page.getByTestId("assessment-comparison");

    await page.goto(`${demoPath}?lang=${language}`);
    await expect(page.getByTestId("demo-banner")).toBeVisible();
    await expect(cards).toHaveCount(5);
    await expect(comparison).toBeVisible();
    await expect(
      page.locator('[data-testid="demo-compare-select"]:checked'),
    ).toHaveCount(2);
    await expect(
      comparison.getByTestId("comparison-record-first"),
    ).toContainText(baseline.title);
    await expect(
      comparison.getByTestId("comparison-record-second"),
    ).toContainText(followUp.title);
    if (page.viewportSize()!.width < 640) {
      const mobile = comparison.getByTestId("comparison-mobile");
      const weight = mobile.locator('[data-metric="weight"]');
      await weight.scrollIntoViewIfNeeded();
      await expect(weight.getByTestId("comparison-first-value")).toHaveText(
        "70",
      );
      await expect(weight.getByTestId("comparison-second-value")).toHaveText(
        "71",
      );
      await expect(weight.getByTestId("comparison-difference")).toHaveText(
        "+1",
      );
      for (const id of [
        "comparison-first-value",
        "comparison-second-value",
        "comparison-difference",
      ])
        await expect(weight.getByTestId(id)).toBeInViewport({ ratio: 1 });
      expect(
        await mobile.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`demo-history-${language}.png`),
        fullPage: true,
      });

    await page.getByTestId("demo-filter-from").fill(baseline.measuredAt);
    await page.getByTestId("demo-filter-to").fill(baseline.measuredAt);
    await page.getByTestId("demo-filter-apply").click();
    await expect(cards).toHaveCount(
      fixtures.filter((record) => record.measuredAt === baseline.measuredAt)
        .length,
    );
    await page.getByTestId("demo-filter-clear").click();
    await expect(cards).toHaveCount(5);
    await page.getByTestId("demo-reset").click();
    await card(followUp.id).getByTestId("demo-compare-select").focus();
    await card(followUp.id).getByTestId("demo-compare-select").press("Space");
    await expect(
      card(followUp.id).getByTestId("demo-compare-select"),
    ).not.toBeChecked();
    await card(other.id).getByTestId("demo-compare-select").focus();
    await card(other.id).getByTestId("demo-compare-select").press("Space");
    await expect(
      card(other.id).getByTestId("demo-compare-select"),
    ).toBeChecked();
    await expect(comparison).toContainText(other.title);

    await card(baseline.id).getByTestId("demo-view").click();
    const results = page.getByRole("region", {
      name: getTranslations(language).results.title,
      exact: true,
    });
    await expect(results).toBeVisible();
    await card(baseline.id).getByTestId("demo-edit").click();
    const editedTitle = "Edited fictional measurement";
    await page.getByTestId("edit-title").fill(editedTitle);
    await page.getByTestId("edit-weight").fill("73");
    await page.getByTestId("edit-submit").click();
    await expect(card(baseline.id)).toContainText(editedTitle);
    if (!(await results.isVisible()))
      await card(baseline.id).getByTestId("demo-view").click();
    const editedResult = calculateHealthResult({
      ...baseline.profile,
      weight: 73,
    });
    const editedEnergy = new Intl.NumberFormat(
      language === "th" ? "th-TH" : "en-US",
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      },
    ).format(editedResult.tdee);
    await expect(
      results.getByText(editedEnergy, { exact: true }).first(),
    ).toBeVisible();
    await card(baseline.id).getByTestId("demo-delete").click();
    await card(baseline.id).getByTestId("demo-confirm-delete").click();
    await expect(cards).toHaveCount(4);
    await expect(card(baseline.id)).toHaveCount(0);
    await page.getByTestId("demo-reset").click();
    await expect(cards).toHaveCount(5);
    await expect(card(baseline.id)).toContainText(baseline.title);
    await expect(comparison).toBeVisible();

    await page.getByTestId("demo-calculator-tab").focus();
    await page.getByTestId("demo-calculator-tab").press("Enter");
    await page
      .getByRole("button", {
        name: getTranslations(language).form.calculate,
        exact: true,
      })
      .click();
    await page
      .getByTestId("demo-save-title")
      .fill("New fictional demo assessment");
    await page.getByTestId("demo-save-date").fill("2024-01-19");
    await page.getByTestId("demo-save-submit").click();
    await page.getByTestId("demo-history-tab").click();
    await expect(cards).toHaveCount(6);
    await expect(
      cards.filter({ hasText: "New fictional demo assessment" }),
    ).toHaveCount(1);
    await page.reload();
    await expect(cards).toHaveCount(5);
    await expect(
      cards.filter({ hasText: "New fictional demo assessment" }),
    ).toHaveCount(0);
    await expect(card(baseline.id)).toContainText(baseline.title);
    await expect(comparison).toBeVisible();
    const nextLanguage = language === "th" ? "en" : "th";
    await page.getByTestId(`demo-lang-${nextLanguage}`).focus();
    await page.getByTestId(`demo-lang-${nextLanguage}`).press("Space");
    await expect(page.getByRole("main")).toHaveAttribute("lang", nextLanguage);
    await expect(cards).toHaveCount(5);
    expect(forbiddenApiRequests).toEqual([]);
    expect(failures).toEqual([]);
  });
}
