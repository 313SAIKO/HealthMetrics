import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTDEEActivityTable,
  calculateIdealWeight,
  calculateMacronutrients,
  getBMICategory,
} from "./calculator";
import type { HealthResult, UserProfile } from "../types";

/** Shared by browser previews and server snapshots; validate the profile first. */
export function calculateHealthResult(profile: UserProfile): HealthResult {
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmr = calculateBMR(
    profile.gender,
    profile.weight,
    profile.height,
    profile.age,
  );
  const tdee = calculateTDEE(bmr, profile.activityMultiplier);
  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    bmr,
    tdee,
    tdeeTable: calculateTDEEActivityTable(bmr),
    idealWeight: calculateIdealWeight(profile.gender, profile.height),
    macronutrients: calculateMacronutrients(tdee, bmi),
  };
}
