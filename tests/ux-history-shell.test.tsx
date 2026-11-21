import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { HistoryWorkspace } from "../src/components/history/HistoryWorkspace";
import { calculateHealthResult } from "../src/core/assessment";
import { announceAccountChange } from "../src/hooks/useAccount";
import { apiRequest } from "../src/components/account/client";
import type { Assessment } from "../src/types/assessment";

const account = vi.hoisted(() => ({
  user: {
    id: "fictional-owner",
    name: "Demo",
    email: "demo@example.invalid",
  } as {
    id: string;
    name: string;
    email: string;
  } | null,
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

afterEach(cleanup);

it("retains the public account disclosure and logout focus while discarding private history drafts", async () => {
  const profile = {
    gender: "M" as const,
    age: 30,
    weight: 70,
    height: 175,
    activityMultiplier: 1.2,
  };
  const saved: Assessment = {
    id: "fictional-record",
    title: "Fictional owner's measurement",
    measuredAt: "2024-01-19",
    profile,
    result: calculateHealthResult(profile),
    formulaVersion: "fictional-test-fixture",
    createdAt: "2024-01-19T00:00:00.000Z",
    updatedAt: "2024-01-19T00:00:00.000Z",
  };
  vi.mocked(apiRequest).mockImplementation(async (url) =>
    url === "/api/auth/sign-out"
      ? undefined
      : { items: [saved], total: 1, page: 1, pageSize: 20 },
  );
  const view = render(<HistoryWorkspace initialLanguage="en" />);
  await screen.findByTestId("assessment-card");
  const accountPanel = screen.getByTestId("account-panel");
  const heading = screen.getByRole("heading", {
    name: "Assessment history",
  });
  fireEvent.click(screen.getByTestId("edit-assessment"));
  fireEvent.change(screen.getByTestId("edit-title"), {
    target: { value: "Unsaved private draft" },
  });
  fireEvent.click(screen.getByTestId("auth-signout"));
  await waitFor(() => expect(announceAccountChange).toHaveBeenCalledOnce());
  account.user = null;
  view.rerender(<HistoryWorkspace initialLanguage="en" />);
  expect(screen.getByTestId("account-panel")).toBe(accountPanel);
  expect(
    screen.getByRole("heading", { name: "Assessment history" }),
  ).toBe(heading);
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByTestId("auth-email")),
  );
  expect(screen.getByTestId("auth-toggle").getAttribute("aria-expanded")).toBe(
    "true",
  );
  expect(screen.getByTestId("auth-submit").closest("[hidden]")).toBeNull();
  expect(screen.queryByTestId("assessment-card")).toBeNull();
  expect(screen.queryByTestId("edit-assessment-form")).toBeNull();
  expect(screen.queryByDisplayValue("Unsaved private draft")).toBeNull();
});
