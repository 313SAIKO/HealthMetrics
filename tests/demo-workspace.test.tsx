import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { DemoWorkspace } from "../src/components/demo/DemoWorkspace";
import { createDemoAssessments } from "../src/demo/fixtures";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("filters, changes comparison, edits, deletes and resets fictional records without an API", async () => {
  const fetch = vi.fn(() => Promise.reject(new Error("Demo must stay local.")));
  vi.stubGlobal("fetch", fetch);
  const fixtures = createDemoAssessments("en");
  const baseline = fixtures.find((record) => record.id === "demo-baseline")!;
  const other = fixtures.find((record) => record.id === "demo-october-late")!;
  render(<DemoWorkspace initialLanguage="en" standalone />);
  const card = (id: string) => {
    const element = screen
      .getAllByTestId("demo-record")
      .find((record) => record.dataset.demoId === id);
    expect(element).toBeTruthy();
    return element!;
  };
  expect(screen.getByTestId("demo-banner").textContent).toMatch(
    /fictional|sample|demo/i,
  );
  expect(screen.getAllByTestId("demo-record")).toHaveLength(5);
  expect(screen.getByTestId("assessment-comparison")).toBeTruthy();
  expect(
    screen
      .getAllByTestId("demo-compare-select")
      .filter((checkbox) => (checkbox as HTMLInputElement).checked),
  ).toHaveLength(2);

  fireEvent.change(screen.getByTestId("demo-filter-from"), {
    target: { value: baseline.measuredAt },
  });
  fireEvent.change(screen.getByTestId("demo-filter-to"), {
    target: { value: baseline.measuredAt },
  });
  fireEvent.click(screen.getByTestId("demo-filter-apply"));
  expect(screen.getAllByTestId("demo-record")).toHaveLength(
    fixtures.filter((record) => record.measuredAt === baseline.measuredAt)
      .length,
  );
  fireEvent.click(screen.getByTestId("demo-filter-clear"));
  expect(screen.getAllByTestId("demo-record")).toHaveLength(5);
  fireEvent.click(screen.getByTestId("demo-reset"));
  fireEvent.click(
    within(card("demo-follow-up")).getByTestId("demo-compare-select"),
  );
  fireEvent.click(within(card(other.id)).getByTestId("demo-compare-select"));
  expect(screen.getByTestId("assessment-comparison").textContent).toContain(
    other.title,
  );

  fireEvent.click(within(card(baseline.id)).getByTestId("demo-edit"));
  fireEvent.change(screen.getByTestId("edit-title"), {
    target: { value: "Edited fictional measurement" },
  });
  fireEvent.change(screen.getByTestId("edit-weight"), {
    target: { value: "73" },
  });
  fireEvent.click(screen.getByTestId("edit-submit"));
  await waitFor(() =>
    expect(card(baseline.id).textContent).toContain(
      "Edited fictional measurement",
    ),
  );
  fireEvent.click(within(card(baseline.id)).getByTestId("demo-delete"));
  fireEvent.click(within(card(baseline.id)).getByTestId("demo-confirm-delete"));
  expect(screen.getAllByTestId("demo-record")).toHaveLength(4);
  fireEvent.click(screen.getByTestId("demo-reset"));
  expect(screen.getAllByTestId("demo-record")).toHaveLength(5);
  expect(card(baseline.id).textContent).toContain(baseline.title);
  expect(screen.queryByText("Edited fictional measurement")).toBeNull();
  expect(screen.getByTestId("assessment-comparison")).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect(createDemoAssessments("en")).toEqual(fixtures);
});
