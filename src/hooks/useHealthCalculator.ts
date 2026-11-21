"use client";

import { useCallback, useState, useEffect } from "react";

import { calculateHealthResult } from "../core/assessment";
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
export function useHealthCalculator(initialLanguage: Language = "th") {
  const [profile, setProfile] = useState<FormProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [language, setLanguage] = useState<Language>(initialLanguage);
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

    setErrors({});
    setResult(
      calculateHealthResult({
        ...profile,
        age: Number(profile.age),
        weight: Number(profile.weight),
        height: Number(profile.height),
      }),
    );

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
