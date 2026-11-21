import { BMI_BOUNDARIES, IDEAL_WEIGHT_HEIGHT, ENERGY_POLICY } from "./policy";
import type {
  Gender,
  BMICategory,
  IdealWeight,
  MacronutrientDietPlans,
  MacronutrientSplit,
  Macronutrients,
  TDEEActivityTable,
} from "../types";

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
} as const;

export const ENERGY_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export const MACRONUTRIENT_DISTRIBUTIONS = {
  moderateCarb: { carbs: 0.4, fat: 0.3, protein: 0.3 },
  lowerCarb: { carbs: 0.2, fat: 0.4, protein: 0.4 },
  higherCarb: { carbs: 0.5, fat: 0.2, protein: 0.3 },
} as const;

/** Calculates BMI from weight in kilograms and height in centimetres. */
export function calculateBMI(weight: number, height: number): number {
  positive(weight, height);
  const heightInMetres = height / 100;

  const result = weight / heightInMetres ** 2;
  positive(result);
  return result;
}

/** Returns the standard BMI category for a calculated BMI value. */
export function getBMICategory(bmi: number): BMICategory {
  positive(bmi);
  if (bmi < BMI_BOUNDARIES[0]) {
    return "Underweight";
  }

  if (bmi < BMI_BOUNDARIES[1]) {
    return "Normal weight";
  }

  if (bmi < BMI_BOUNDARIES[2]) {
    return "Overweight";
  }

  return "Obesity";
}

/** Calculates BMR using the Mifflin-St Jeor equation. */
export function calculateBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number,
): number {
  positive(weight, height, age);
  if (gender !== "M" && gender !== "F") throw new RangeError("Invalid sex");
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  const result = gender === "M" ? baseBMR + 5 : baseBMR - 161;
  positive(result);
  return result;
}

/** Calculates total daily energy expenditure from BMR and activity level. */
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  positive(bmr, activityMultiplier);
  const result = bmr * activityMultiplier;
  positive(result);
  return result;
}

/** Calculates TDEE estimates for every standard activity level. */
export function calculateTDEEActivityTable(bmr: number): TDEEActivityTable {
  return {
    basal: bmr,
    sedentary: calculateTDEE(bmr, ACTIVITY_MULTIPLIERS.sedentary),
    light: calculateTDEE(bmr, ACTIVITY_MULTIPLIERS.light),
    moderate: calculateTDEE(bmr, ACTIVITY_MULTIPLIERS.moderate),
    heavy: calculateTDEE(bmr, ACTIVITY_MULTIPLIERS.heavy),
    athlete: calculateTDEE(bmr, ACTIVITY_MULTIPLIERS.athlete),
  };
}

/**
 * Calculates ideal body weight in kilograms using Hamwi, Devine, Robinson,
 * and Miller formulas.
 */
export function calculateIdealWeight(
  gender: Gender,
  height: number,
): IdealWeight | null {
  positive(height);
  if (height < IDEAL_WEIGHT_HEIGHT.min || height > IDEAL_WEIGHT_HEIGHT.max)
    return null;
  const heightInInches = height / 2.54;
  const inchesOverFiveFeet = heightInInches - 60;
  const isMale = gender === "M";

  return {
    hamwi:
      ((isMale ? 106 : 100) + (isMale ? 6 : 5) * inchesOverFiveFeet) *
      0.45359237,
    devine: (isMale ? 50 : 45.5) + 2.3 * inchesOverFiveFeet,
    robinson: (isMale ? 52 : 49) + (isMale ? 1.9 : 1.7) * inchesOverFiveFeet,
    miller:
      (isMale ? 56.2 : 53.1) + (isMale ? 1.41 : 1.36) * inchesOverFiveFeet,
  };
}

/** Converts calorie targets and macro percentages into daily grams. */
function calculateMacronutrientSplit(
  calories: number,
  distribution: {
    carbs: number;
    fat: number;
    protein: number;
  },
): MacronutrientSplit {
  positive(calories);
  return {
    protein: (calories * distribution.protein) / ENERGY_PER_GRAM.protein,
    fat: (calories * distribution.fat) / ENERGY_PER_GRAM.fat,
    carbs: (calories * distribution.carbs) / ENERGY_PER_GRAM.carbs,
  };
}

/** Calculates macro plans for one calorie target across three diet styles. */
function calculateDietPlans(calories: number): MacronutrientDietPlans {
  return {
    moderateCarb: calculateMacronutrientSplit(
      calories,
      MACRONUTRIENT_DISTRIBUTIONS.moderateCarb,
    ),
    lowerCarb: calculateMacronutrientSplit(
      calories,
      MACRONUTRIENT_DISTRIBUTIONS.lowerCarb,
    ),
    higherCarb: calculateMacronutrientSplit(
      calories,
      MACRONUTRIENT_DISTRIBUTIONS.higherCarb,
    ),
  };
}

/**
 * Calculates daily macronutrient targets for maintenance, a 500 kcal cut,
 * and a 500 kcal surplus.
 */
export function calculateMacronutrients(
  tdee: number,
  bmi = 22,
): Macronutrients {
  positive(tdee, bmi);
  return {
    maintenance: calculateDietPlans(tdee),
    cutting:
      bmi >= BMI_BOUNDARIES[0] &&
      tdee - ENERGY_POLICY.adjustment >= ENERGY_POLICY.minimumCutting
        ? calculateDietPlans(tdee - ENERGY_POLICY.adjustment)
        : null,
    bulking:
      bmi >= BMI_BOUNDARIES[0]
        ? calculateDietPlans(tdee + ENERGY_POLICY.adjustment)
        : null,
  };
}

function positive(...values: number[]) {
  if (values.some((value) => !Number.isFinite(value) || value <= 0))
    throw new RangeError("Values must be finite and positive");
}
