'use client';

import { useCallback, useState } from 'react';

import {
  calculateBMI,
  calculateBMR,
  calculateIdealWeight,
  calculateMacronutrients,
  calculateTDEE,
  calculateTDEEActivityTable,
  getBMICategory,
} from '../core/calculator';
import type { HealthResult, Language, UserProfile } from '../types';

type ValidationErrors = Partial<Record<keyof UserProfile, string>>;

const DEFAULT_PROFILE: UserProfile = {
  gender: 'M',
  age: 30,
  weight: 70,
  height: 175,
  activityMultiplier: 1.2,
};

function validateProfile(profile: UserProfile): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isFinite(profile.age) || profile.age <= 0) {
    errors.age = 'Age must be greater than 0.';
  }

  if (!Number.isFinite(profile.weight) || profile.weight <= 0) {
    errors.weight = 'Weight must be greater than 0.';
  }

  if (!Number.isFinite(profile.height) || profile.height <= 0) {
    errors.height = 'Height must be greater than 0.';
  }

  if (
    !Number.isFinite(profile.activityMultiplier) ||
    profile.activityMultiplier <= 0
  ) {
    errors.activityMultiplier = 'Activity level must be greater than 0.';
  }

  return errors;
}

/** Bridges health-calculator form state with the pure calculation layer. */
export function useHealthCalculator() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [language, setLanguage] = useState<Language>('th');

  const updateProfile = useCallback(
    <Field extends keyof UserProfile>(field: Field, value: UserProfile[Field]) => {
      setProfile((currentProfile) => ({
        ...currentProfile,
        [field]: value,
      }));
      setErrors((currentErrors) => {
        const { [field]: _, ...remainingErrors } = currentErrors;

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
      profile.weight,
      profile.height,
      profile.age,
    );
    const bmi = calculateBMI(profile.weight, profile.height);
    const tdee = calculateTDEE(bmr, profile.activityMultiplier);

    setErrors({});
    setResult({
      bmi,
      bmiCategory: getBMICategory(bmi),
      bmr,
      tdee,
      tdeeTable: calculateTDEEActivityTable(bmr),
      idealWeight: calculateIdealWeight(profile.gender, profile.height),
      macronutrients: calculateMacronutrients(tdee),
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
