import { PROFILE_LIMITS } from "./policy";
import { ACTIVITY_MULTIPLIERS } from "./calculator";
import type { FormProfile, UserProfile } from "../types";
export type ValidationErrorCode =
  "age" | "weight" | "height" | "activity" | "gender";
export type ValidationErrors = Partial<
  Record<keyof UserProfile, ValidationErrorCode>
>;
export function validateProfile(profile: FormProfile): ValidationErrors {
  const errors: ValidationErrors = {};
  if (
    !Number.isInteger(profile.age) ||
    Number(profile.age) < PROFILE_LIMITS.age.min ||
    Number(profile.age) > PROFILE_LIMITS.age.max
  )
    errors.age = "age";
  if (
    !Number.isFinite(profile.weight) ||
    Number(profile.weight) < PROFILE_LIMITS.weight.min ||
    Number(profile.weight) > PROFILE_LIMITS.weight.max
  )
    errors.weight = "weight";
  if (
    !Number.isFinite(profile.height) ||
    Number(profile.height) < PROFILE_LIMITS.height.min ||
    Number(profile.height) > PROFILE_LIMITS.height.max
  )
    errors.height = "height";
  if (
    !Object.values(ACTIVITY_MULTIPLIERS).some(
      (value) => value === profile.activityMultiplier,
    )
  )
    errors.activityMultiplier = "activity";
  if (profile.gender !== "M" && profile.gender !== "F")
    errors.gender = "gender";
  return errors;
}
