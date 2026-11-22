// @vitest-environment node
import { expect, it } from "vitest";
import { createDemoAssessments } from "../src/demo/fixtures";
import { calculateHealthResult } from "../src/core/assessment";
import { validateProfile } from "../src/core/validation";

it.each(["th", "en"] as const)(
  "provides valid fictional snapshots from the canonical calculator in %s",
  (language) => {
    const records = createDemoAssessments(language);
    expect(records).toHaveLength(5);
    expect(new Set(records.map((record) => record.id)).size).toBe(
      records.length,
    );
    for (const record of records) {
      expect(record.id).toMatch(/^demo-/);
      expect(record.title.trim().length).toBeGreaterThan(0);
      expect(record.title.length).toBeLessThanOrEqual(120);
      expect(record.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(
        new Date(`${record.measuredAt}T00:00:00.000Z`)
          .toISOString()
          .slice(0, 10),
      ).toBe(record.measuredAt);
      expect(validateProfile(record.profile)).toEqual({});
      expect(record.result).toEqual(calculateHealthResult(record.profile));
      expect(record.formulaVersion.length).toBeGreaterThan(0);
      expect(record).not.toHaveProperty("userId");
      expect(record).not.toHaveProperty("email");
    }
  },
);

it("returns independent nested copies so one demo visit cannot mutate another", () => {
  const first = createDemoAssessments("en");
  const expected = structuredClone(first);
  const second = createDemoAssessments("en");
  first[0].title = "Changed only in the first visit";
  first[0].profile.weight = 299;
  first[0].result.tdeeTable.sedentary = 0;
  first[0].result.macronutrients.maintenance.moderateCarb.protein = 0;
  first.pop();
  expect(second).toEqual(expected);
  expect(createDemoAssessments("en")).toEqual(expected);
});

it("localizes fixture names without changing measurement identity or calculations", () => {
  const thai = createDemoAssessments("th");
  const english = createDemoAssessments("en");
  expect(thai.map((record) => record.id)).toEqual(
    english.map((record) => record.id),
  );
  expect(thai.map((record) => record.title)).not.toEqual(
    english.map((record) => record.title),
  );
  for (const [index, record] of thai.entries()) {
    expect(record.profile).toEqual(english[index].profile);
    expect(record.result).toEqual(english[index].result);
    expect(record.measuredAt).toBe(english[index].measuredAt);
  }
});
