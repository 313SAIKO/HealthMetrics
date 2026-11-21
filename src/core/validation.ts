import { ACTIVITY_MULTIPLIERS } from "./calculator";
import type { FormProfile, UserProfile } from "../types";
export type ValidationErrors = Partial<Record<keyof UserProfile, string>>;
export function validateProfile(profile: FormProfile): ValidationErrors {
  const errors: ValidationErrors = {};
  if (
    !Number.isInteger(profile.age) ||
    Number(profile.age) < 20 ||
    Number(profile.age) > 78
  )
    errors.age = "age";
  if (
    !Number.isFinite(profile.weight) ||
    Number(profile.weight) < 20 ||
    Number(profile.weight) > 300
  )
    errors.weight = "weight";
  if (
    !Number.isFinite(profile.height) ||
    Number(profile.height) < 100 ||
    Number(profile.height) > 220
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
export const validationMessages = {
  th: {
    age: "รองรับอายุจำนวนเต็ม 20–78 ปี",
    weight: "กรอกน้ำหนัก 20–300 กก.",
    height: "กรอกส่วนสูง 100–220 ซม.",
    activity: "เลือกระดับกิจกรรมจากรายการ",
    gender: "เลือกเพศที่ใช้ในสมการ",
  },
  en: {
    age: "Enter a whole age from 20 to 78 years.",
    weight: "Enter a weight from 20 to 300 kg.",
    height: "Enter a height from 100 to 220 cm.",
    activity: "Choose an activity from the list.",
    gender: "Choose the sex used by the equation.",
  },
};
