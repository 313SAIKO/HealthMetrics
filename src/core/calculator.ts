import type {
  Gender,
  IdealWeight,
  MacronutrientDietPlans,
  MacronutrientSplit,
  Macronutrients,
  TDEEActivityTable,
} from '../types';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
} as const;

const MACRONUTRIENT_DISTRIBUTIONS = {
  moderateCarb: { carbs: 0.4, fat: 0.3, protein: 0.3 },
  lowerCarb: { carbs: 0.2, fat: 0.4, protein: 0.4 },
  higherCarb: { carbs: 0.5, fat: 0.2, protein: 0.3 },
} as const;

/** Calculates BMI from weight in kilograms and height in centimetres. */
export function calculateBMI(weight: number, height: number): number {
  const heightInMetres = height / 100;

  return weight / heightInMetres ** 2;
}

/** Returns the standard BMI category for a calculated BMI value. */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) {
    return 'Underweight';
  }

  if (bmi < 25) {
    return 'Normal weight';
  }

  if (bmi < 30) {
    return 'Overweight';
  }

  return 'Obesity';
}

/** Calculates BMR using the Mifflin-St Jeor equation. */
export function calculateBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number,
): number {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  return gender === 'M' ? baseBMR + 5 : baseBMR - 161;
}

/** Calculates total daily energy expenditure from BMR and activity level. */
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
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
export function calculateIdealWeight(gender: Gender, height: number): IdealWeight {
  const heightInInches = height / 2.54;
  const inchesOverFiveFeet = Math.max(0, heightInInches - 60);
  const isMale = gender === 'M';

  return {
    hamwi: (isMale ? 48 : 45.5) + 2.7 * inchesOverFiveFeet,
    devine: (isMale ? 50 : 45.5) + 2.3 * inchesOverFiveFeet,
    robinson: (isMale ? 52 : 49) + (isMale ? 1.9 : 1.7) * inchesOverFiveFeet,
    miller: (isMale ? 56.2 : 53.1) + (isMale ? 1.41 : 1.36) * inchesOverFiveFeet,
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
  return {
    protein: (calories * distribution.protein) / 4,
    fat: (calories * distribution.fat) / 9,
    carbs: (calories * distribution.carbs) / 4,
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
export function calculateMacronutrients(tdee: number): Macronutrients {
  return {
    maintenance: calculateDietPlans(tdee),
    cutting: calculateDietPlans(Math.max(0, tdee - 500)),
    bulking: calculateDietPlans(tdee + 500),
  };
}
