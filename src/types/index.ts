/** Biological sex used by the Mifflin-St Jeor BMR equation. */
export type Gender = "M" | "F";

/** Supported application display languages. */
export type BMICategory =
  "Underweight" | "Normal weight" | "Overweight" | "Obesity";
export type FormProfile = Omit<UserProfile, "age" | "weight" | "height"> & {
  age: number | "";
  weight: number | "";
  height: number | "";
};

export type Language = "en" | "th";

/** Input values required to calculate a user's health metrics. */
export interface UserProfile {
  gender: Gender;
  age: number;
  /** Body weight in kilograms. */
  weight: number;
  /** Height in centimetres. */
  height: number;
  activityMultiplier: number;
}

/** Estimated total daily energy expenditure at each activity level. */
export interface TDEEActivityTable {
  basal: number;
  sedentary: number;
  light: number;
  moderate: number;
  heavy: number;
  athlete: number;
}

/** Ideal body-weight estimates calculated with common clinical formulas. */
export interface IdealWeight {
  hamwi: number;
  devine: number;
  robinson: number;
  miller: number;
}

/** Daily macronutrient targets in grams. */
export interface MacronutrientSplit {
  protein: number;
  fat: number;
  carbs: number;
}

/** Macronutrient splits for three carbohydrate distributions. */
export interface MacronutrientDietPlans {
  moderateCarb: MacronutrientSplit;
  lowerCarb: MacronutrientSplit;
  higherCarb: MacronutrientSplit;
}

/** Macronutrient targets for maintenance, cutting, and bulking goals. */
export interface Macronutrients {
  maintenance: MacronutrientDietPlans;
  cutting: MacronutrientDietPlans | null;
  bulking: MacronutrientDietPlans | null;
}

/** Calculated health metrics ready for presentation. */
export interface HealthResult {
  bmi: number;
  bmiCategory: BMICategory;
  bmr: number;
  tdee: number;
  tdeeTable: TDEEActivityTable;
  idealWeight: IdealWeight | null;
  macronutrients: Macronutrients;
}
