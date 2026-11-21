import { test, expect } from "@playwright/test";

test("shares one session request across calculator and history consumers", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/get-session") requests++;
  });
  await page.goto("/?lang=en");
  const toggle = page.getByTestId("auth-toggle");
  const email = page.getByTestId("auth-email");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", /\S+/);
  await expect(email).not.toBeVisible();
  await toggle.focus();
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(email).toBeFocused();
  await email.press("Escape");
  await expect(email).not.toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.press("Space");
  await expect(email).toBeVisible();
  await expect(email).toBeFocused();
  expect(requests).toBe(1);
  await page.getByRole("button", { name: "Calculate my results" }).click();
  await expect(
    page.getByRole("heading", { name: "Save this assessment" }),
  ).toBeVisible();
  await expect(
    page.getByText("Sign in to save and view your records.", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
  requests = 0;
  await page.goto("/history?lang=en");
  await expect(page.getByTestId("auth-toggle")).toBeVisible();
  await page.getByTestId("auth-toggle").click();
  await expect(page.getByTestId("auth-email")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Assessment history", exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
});
