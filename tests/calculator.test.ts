import type { MacronutrientSplit } from "../src/types";
import { describe, it, expect } from "vitest";
import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  getBMICategory,
  calculateIdealWeight,
  calculateMacronutrients,
} from "../src/core/calculator";
import { validateProfile } from "../src/core/validation";
const profile = {
  gender: "M" as const,
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};
describe("health estimates", () => {
  it("preserves known adult reference results", () => {
    expect(calculateBMI(70, 175)).toBeCloseTo(22.85714);
    expect(calculateBMR("M", 70, 175, 30)).toBe(1648.75);
    expect(calculateBMR("F", 70, 175, 30)).toBe(1482.75);
    expect(calculateTDEE(1648.75, 1.2)).toBe(1978.5);
  });
  it.each([
    [18.499, "Underweight"],
    [18.5, "Normal weight"],
    [24.999, "Normal weight"],
    [25, "Overweight"],
    [30, "Obesity"],
  ])("classifies %s", (bmi, category) =>
    expect(getBMICategory(Number(bmi))).toBe(category),
  );
  it("uses sex-specific Hamwi coefficients", () => {
    expect(calculateIdealWeight("F", 170)?.hamwi).toBeCloseTo(61.0742, 3);
    expect(calculateIdealWeight("M", 170)?.hamwi).toBeCloseTo(
      (106 + 6 * (170 / 2.54 - 60)) * 0.45359237,
    );
  });
  it("withholds unsupported ideal weights", () => {
    expect(calculateIdealWeight("F", 140)).toBeNull();
    expect(calculateIdealWeight("F", 152.4)).not.toBeNull();
  });
  it("withholds very low cutting and underweight goal plans", () => {
    expect(calculateMacronutrients(1081.8).cutting).toBeNull();
    expect(calculateMacronutrients(2500, 18).cutting).toBeNull();
    expect(calculateMacronutrients(2500, 18).bulking).toBeNull();
  });
  it("conserves calories in every diet and goal", () => {
    const plans = calculateMacronutrients(2200);
    for (const [goal, plan] of Object.entries(plans)) {
      if (plan)
        for (const split of Object.values(plan) as MacronutrientSplit[])
          expect(
            split.protein * 4 + split.fat * 9 + split.carbs * 4,
          ).toBeCloseTo(
            goal === "cutting" ? 1700 : goal === "bulking" ? 2700 : 2200,
          );
    }
  });
  it("rejects zero, negative, nonfinite and overflow calculations", () => {
    expect(() => calculateBMI(70, 0)).toThrow();
    expect(() => calculateBMR("F", 10, 10, 30)).toThrow();
    expect(() => calculateBMR("M", 1e308, 175, 30)).toThrow();
    expect(() => calculateTDEE(Infinity, 1.2)).toThrow();
  });
  it.each([
    { age: 12 },
    { age: 79 },
    { age: 30.5 },
    { weight: "" },
    { weight: 1e308 },
    { height: 10 },
    { activityMultiplier: 99 },
  ])("rejects unsupported profile %j", (change) =>
    expect(
      Object.keys(validateProfile({ ...profile, ...change } as typeof profile))
        .length,
    ).toBeGreaterThan(0),
  );
});

it.each([
  ["age", 20, true],
  ["age", 78, true],
  ["age", 19, false],
  ["age", 79, false],
  ["weight", 20, true],
  ["weight", 300, true],
  ["weight", 19.9, false],
  ["weight", 300.1, false],
  ["height", 100, true],
  ["height", 220, true],
  ["height", 99.9, false],
  ["height", 220.1, false],
])("validates %s boundary %s", (field, value, accepted) => {
  expect(
    Object.keys(validateProfile({ ...profile, [field]: value })).length === 0,
  ).toBe(accepted);
});

it("opens cutting exactly at the product energy and BMI boundaries", () => {
  expect(calculateMacronutrients(1999.99, 18.5).cutting).toBeNull();
  expect(calculateMacronutrients(2000, 18.49999).cutting).toBeNull();
  const plan = calculateMacronutrients(2000, 18.5).cutting;
  expect(plan).not.toBeNull();
  expect(
    plan!.moderateCarb.protein * 4 +
      plan!.moderateCarb.carbs * 4 +
      plan!.moderateCarb.fat * 9,
  ).toBeCloseTo(1500);
});
