import { test, expect } from "@playwright/test";

for (const language of ["th", "en"] as const) {
  test(`calculates and exposes complete results in ${language}`, async ({
    page,
  }, testInfo) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.goto("/");
    if (language === "en")
      await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByTestId("auth-toggle")).toBeVisible();
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`calculator-empty-${language}.png`),
        fullPage: true,
      });
    const submit = page.getByRole("button", {
      name: language === "th" ? "คำนวณผลลัพธ์" : "Calculate my results",
    });
    await submit.click();
    await expect(
      page.getByText("1,978.5", { exact: true }).first(),
    ).toBeVisible();
    if ([320, 1280].includes(page.viewportSize()!.width))
      await page.screenshot({
        path: testInfo.outputPath(`calculator-results-${language}.png`),
        fullPage: true,
      });
    const carbs = page.getByText(language === "th" ? "คาร์โบไฮเดรต" : "Carbs", {
      exact: true,
    });
    await expect(carbs).toHaveCount(3);
    for (const label of await carbs.all()) {
      await label.scrollIntoViewIfNeeded();
      expect(
        await label.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      const box = await label.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
    }
    const goalLabels =
      language === "th"
        ? ["รักษาน้ำหนัก", "ลดน้ำหนัก", "เพิ่มน้ำหนัก"]
        : ["Maintenance", "Cutting", "Bulking"];
    for (const name of goalLabels) {
      const button = page.getByRole("button", { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      expect(
        await button.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      const box = await button.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
    }
    await page
      .getByRole("button", {
        name: language === "th" ? "ลดน้ำหนัก" : "Cutting",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText("1,500");
    await page
      .getByRole("button", {
        name: language === "th" ? "เพิ่มน้ำหนัก" : "Bulking",
        exact: true,
      })
      .click();
    await expect(page.getByText("2,478.5 kcal", { exact: true })).toHaveCount(
      3,
    );
    expect(failures).toEqual([]);
  });
}

test("corrects multiple errors with the keyboard without losing focus", async ({
  page,
}) => {
  await page.goto("/");
  const age = page.getByLabel("อายุ", { exact: true });
  const weight = page.getByLabel(/น้ำหนัก/);
  await age.fill("");
  await weight.fill("");
  await page.getByRole("button", { name: "คำนวณผลลัพธ์" }).click();
  await expect(age).toBeFocused();
  await age.press("2");
  await expect(age).toBeFocused();
  await age.press("0");
  await expect(age).toHaveValue("20");
  await age.press("Tab");
  await expect(weight).toBeFocused();
  await weight.press("7");
  await weight.press("0");
  await weight.press("Enter");
  await expect(
    page.getByText("2,038.5", { exact: true }).first(),
  ).toBeVisible();
});
