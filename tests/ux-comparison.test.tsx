import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { AssessmentComparison } from "../src/components/history/AssessmentComparison";
import { calculateHealthResult } from "../src/core/assessment";
import type { UserProfile } from "../src/types";
import type { Assessment } from "../src/types/assessment";
import { getWorkspaceTranslations } from "../src/utils/workspace-translations";

const profile: UserProfile = {
  gender: "M",
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};

function record(id: string, title: string, weight: number): Assessment {
  const measuredProfile = { ...profile, weight };
  return {
    id,
    title,
    measuredAt: "2024-01-19",
    createdAt: "2024-01-19T00:00:00.000Z",
    updatedAt: "2024-01-19T00:00:00.000Z",
    profile: measuredProfile,
    result: calculateHealthResult(measuredProfile),
    formulaVersion: "fictional-test-fixture",
  };
}

afterEach(cleanup);

it.each(["th", "en"] as const)(
  "retains long record identities and both values with signed differences in %s",
  (language) => {
    const records: [Assessment, Assessment] = [
      record("first", "A".repeat(120), 70),
      record("second", "ข".repeat(120), 72),
    ];
    const clear = vi.fn();
    render(
      <AssessmentComparison
        records={records}
        language={language}
        onClear={clear}
      />,
    );
    expect(screen.getByTestId("comparison-record-first").textContent).toContain(
      records[0].title,
    );
    expect(
      screen.getByTestId("comparison-record-second").textContent,
    ).toContain(records[1].title);
    const mobile = screen.getByTestId("comparison-mobile");
    for (const metric of [
      { key: "weight", values: ["70", "72", "+2"] },
      { key: "tdee", values: ["1,978.5", "2,002.5", "+24"] },
    ]) {
      const row = within(mobile)
        .getAllByTestId("comparison-metric")
        .find((element) => element.dataset.metric === metric.key);
      expect(row).toBeTruthy();
      expect(
        within(row!).getByTestId("comparison-first-value").textContent,
      ).toBe(metric.values[0]);
      expect(
        within(row!).getByTestId("comparison-second-value").textContent,
      ).toBe(metric.values[1]);
      expect(
        within(row!).getByTestId("comparison-difference").textContent,
      ).toBe(metric.values[2]);
    }
    fireEvent.click(
      screen.getByRole("button", {
        name: getWorkspaceTranslations(language).clearComparison,
      }),
    );
    expect(clear).toHaveBeenCalledTimes(1);
  },
);
