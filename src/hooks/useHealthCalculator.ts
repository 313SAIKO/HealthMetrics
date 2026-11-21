"use client";

import { useCallback, useState, useEffect } from "react";

import {
  calculateBMI,
  calculateBMR,
  calculateIdealWeight,
  calculateMacronutrients,
  calculateTDEE,
  calculateTDEEActivityTable,
  getBMICategory,
} from "../core/calculator";
import type {
  HealthResult,
  Language,
  UserProfile,
  FormProfile,
} from "../types";

import { validateProfile, type ValidationErrors } from "../core/validation";

const DEFAULT_PROFILE: UserProfile = {
  gender: "M",
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};

/** Bridges health-calculator form state with the pure calculation layer. */
export function useHealthCalculator() {
  const [profile, setProfile] = useState<FormProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [language, setLanguage] = useState<Language>("th");
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const updateProfile = useCallback(
    <Field extends keyof UserProfile>(
      field: Field,
      value: FormProfile[Field],
    ) => {
      setResult(null);
      setProfile((currentProfile) => ({
        ...currentProfile,
        [field]: value,
      }));
      setErrors((currentErrors) => {
        const remainingErrors = { ...currentErrors };
        delete remainingErrors[field];

        return remainingErrors;
      });
    },
    [],
  );

  const calculate = useCallback((): boolean => {
    const validationErrors = validateProfile(profile);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResult(null);

      return false;
    }

    const bmr = calculateBMR(
      profile.gender,
      Number(profile.weight),
      Number(profile.height),
      Number(profile.age),
    );
    const bmi = calculateBMI(Number(profile.weight), Number(profile.height));
    const tdee = calculateTDEE(bmr, profile.activityMultiplier);

    setErrors({});
    setResult({
      bmi,
      bmiCategory: getBMICategory(bmi),
      bmr,
      tdee,
      tdeeTable: calculateTDEEActivityTable(bmr),
      idealWeight: calculateIdealWeight(profile.gender, Number(profile.height)),
      macronutrients: calculateMacronutrients(tdee, bmi),
    });

    return true;
  }, [profile]);

  return {
    calculate,
    errors,
    language,
    profile,
    result,
    setLanguage,
    updateProfile,
  };
}
