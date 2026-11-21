import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SaveAssessment } from "../src/components/history/SaveAssessment";
import { calculateHealthResult } from "../src/core/assessment";
import type { UserProfile } from "../src/types";
import { apiRequest, ApiError } from "../src/components/account/client";

const account = vi.hoisted(() => ({
  user: { id: "account-a", name: "A", email: "a@example.test" },
  loading: false,
  error: false,
  refresh: vi.fn(),
}));
vi.mock("../src/hooks/useAccount", () => ({
  useAccount: () => account,
  announceAccountChange: vi.fn(),
}));
vi.mock("../src/components/account/client", async (original) => ({
  ...(await original<typeof import("../src/components/account/client")>()),
  apiRequest: vi.fn(),
}));
const profile: UserProfile = {
  gender: "M",
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};
const result = calculateHealthResult(profile);
const view = (language: "en" | "th" = "en") => (
  <SaveAssessment language={language} profile={profile} result={result} />
);
beforeEach(() => {
  account.user = { id: "account-a", name: "A", email: "a@example.test" };
  account.loading = false;
  account.error = false;
  vi.mocked(apiRequest).mockReset();
});
afterEach(cleanup);

it("preserves an unsaved draft through same-account refresh while hiding the form during loading", () => {
  const page = render(view());
  fireEvent.change(screen.getByTestId("save-title"), {
    target: { value: "Still writing" },
  });
  fireEvent.change(screen.getByTestId("save-date"), {
    target: { value: "2024-05-12" },
  });
  account.loading = true;
  page.rerender(view());
  expect(screen.queryByTestId("save-assessment-form")).toBeNull();
  account.loading = false;
  page.rerender(view());
  expect((screen.getByTestId("save-title") as HTMLInputElement).value).toBe(
    "Still writing",
  );
  expect((screen.getByTestId("save-date") as HTMLInputElement).value).toBe(
    "2024-05-12",
  );
  expect(apiRequest).not.toHaveBeenCalled();
});

it("sends only explicit inputs and gives another account a fresh save form", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ id: "saved" });
  const page = render(view());
  expect(apiRequest).not.toHaveBeenCalled();
  fireEvent.change(screen.getByTestId("save-title"), {
    target: { value: "A's measurement" },
  });
  fireEvent.submit(screen.getByTestId("save-assessment-form"));
  await screen.findByText("Assessment saved to your history.");
  const init = vi.mocked(apiRequest).mock.calls[0][1];
  expect(JSON.parse(String(init?.body))).toEqual({
    title: "A's measurement",
    measuredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    profile,
  });
  expect(
    (screen.getByTestId("save-assessment-submit") as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  account.user = { id: "account-b", name: "B", email: "b@example.test" };
  page.rerender(view());
  expect(screen.queryByText("Assessment saved to your history.")).toBeNull();
  expect((screen.getByTestId("save-title") as HTMLInputElement).value).toBe("");
  expect(
    (screen.getByTestId("save-assessment-submit") as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it("ignores a previous account's save response after the account changes", async () => {
  let complete!: (value: unknown) => void;
  vi.mocked(apiRequest).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const page = render(view());
  fireEvent.change(screen.getByTestId("save-title"), {
    target: { value: "Pending for A" },
  });
  fireEvent.submit(screen.getByTestId("save-assessment-form"));
  account.user = { id: "account-b", name: "B", email: "b@example.test" };
  page.rerender(view());
  await act(async () => {
    complete({ id: "saved-for-a" });
  });
  expect(screen.queryByText("Assessment saved to your history.")).toBeNull();
  expect(
    (screen.getByTestId("save-assessment-submit") as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  expect((screen.getByTestId("save-title") as HTMLInputElement).value).toBe("");
});

it("translates validation and request errors when the language changes", async () => {
  const page = render(view());
  fireEvent.submit(screen.getByTestId("save-assessment-form"));
  expect(screen.getByRole("alert").textContent).toContain("Enter a title");
  page.rerender(view("th"));
  expect(screen.getByRole("alert").textContent).toContain("กรอกชื่อรายการ");
  vi.mocked(apiRequest).mockRejectedValue(new ApiError(400, "INVALID_INPUT"));
  fireEvent.change(screen.getByTestId("save-title"), {
    target: { value: "Measurement" },
  });
  fireEvent.submit(screen.getByTestId("save-assessment-form"));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("โปรดตรวจสอบข้อมูล"),
  );
  page.rerender(view());
  expect(screen.getByRole("alert").textContent).toContain(
    "Check the information",
  );
});
