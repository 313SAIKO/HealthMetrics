import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HistoryWorkspace } from "../src/components/history/HistoryWorkspace";
import { calculateHealthResult } from "../src/core/assessment";
import type { Assessment, AssessmentInput } from "../src/types/assessment";
import { apiRequest } from "../src/components/account/client";

const account = vi.hoisted(() => ({
  user: { id: "a", email: "a@example.invalid", name: "A" },
  loading: false,
  error: false,
  refresh: vi.fn(),
}));
vi.mock("../src/hooks/useAccount", () => ({
  useAccount: () => account,
  announceAccountChange: vi.fn(),
}));
vi.mock("../src/components/account/AccountPanel", () => ({
  AccountPanel: () => null,
}));
vi.mock("../src/components/account/client", async (original) => ({
  ...(await original<typeof import("../src/components/account/client")>()),
  apiRequest: vi.fn(),
}));
const input: AssessmentInput = {
  title: "Record",
  measuredAt: "2026-11-20",
  profile: {
    gender: "M",
    age: 30,
    weight: 70,
    height: 175,
    activityMultiplier: 1.2,
  },
};
function record(owner: string): Assessment {
  return {
    ...input,
    id: owner,
    title: `Record ${owner.toUpperCase()}`,
    result: calculateHealthResult(input.profile),
    formulaVersion: "test",
    createdAt: "2026-11-20T00:00:00Z",
    updatedAt: "2026-11-20T00:00:00Z",
  };
}
beforeEach(() => {
  account.user = { id: "a", email: "a@example.invalid", name: "A" };
  vi.mocked(apiRequest).mockReset();
});
afterEach(cleanup);

it.each(["PATCH", "DELETE"])(
  "ignores an old owner's delayed %s completion without disturbing the next account",
  async (method) => {
    let finish: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    vi.mocked(apiRequest).mockImplementation(async (_url, init) => {
      if (init?.method === method) return pending;
      return {
        items: [record(account.user.id)],
        total: 1,
        page: 1,
        pageSize: 20,
      };
    });
    const view = render(<HistoryWorkspace initialLanguage="en" />);
    await screen.findByRole("heading", { name: "Record A" });
    if (method === "PATCH") {
      fireEvent.click(screen.getByTestId("edit-assessment"));
      fireEvent.change(screen.getByTestId("edit-title"), {
        target: { value: "Changed A" },
      });
      fireEvent.click(screen.getByTestId("edit-submit"));
    } else {
      fireEvent.click(screen.getByTestId("delete-assessment"));
      fireEvent.click(screen.getByTestId("confirm-delete"));
    }
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "/api/assessments/a",
        expect.objectContaining({ method }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "TH" }));
    account.user = { id: "b", email: "b@example.invalid", name: "B" };
    view.rerender(<HistoryWorkspace initialLanguage="en" />);
    await screen.findByRole("heading", { name: "Record B" });
    expect(screen.getByRole("main").getAttribute("lang")).toBe("th");
    fireEvent.click(screen.getByTestId("edit-assessment"));
    fireEvent.change(screen.getByTestId("edit-title"), {
      target: { value: "Draft for B" },
    });
    await act(async () => {
      finish(method === "PATCH" ? record("a") : undefined);
      await pending;
    });
    expect((screen.getByTestId("edit-title") as HTMLInputElement).value).toBe(
      "Draft for B",
    );
    expect(screen.queryByText("แก้ไขข้อมูลและคำนวณใหม่แล้ว")).toBeNull();
    expect(screen.queryByText("ลบการประเมินแล้ว")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  },
);
