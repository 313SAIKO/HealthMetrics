"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { ACTIVITY_MULTIPLIERS } from "../../core/calculator";
import { validationMessages } from "../../core/validation";

import type { Language, UserProfile, FormProfile } from "../../types";
import { getTranslations } from "../../utils/translations";

type ValidationErrors = Partial<Record<keyof UserProfile, string>>;

interface HealthFormProps {
  errors: ValidationErrors;
  language: Language;
  profile: FormProfile;
  onCalculate: () => void;
  onProfileChange: <Field extends keyof UserProfile>(
    field: Field,
    value: FormProfile[Field],
  ) => void;
}

const inputClassName =
  "mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4";

export function HealthForm({
  errors,
  language,
  profile,
  onCalculate,
  onProfileChange,
}: HealthFormProps) {
  const t = getTranslations(language);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (Object.keys(errors).length)
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [errors]);
  const message = (code: string) =>
    validationMessages[language][code as keyof typeof validationMessages.en];
  const activityLevels = [
    { label: t.activity.sedentary, value: ACTIVITY_MULTIPLIERS.sedentary },
    { label: t.activity.light, value: ACTIVITY_MULTIPLIERS.light },
    { label: t.activity.moderate, value: ACTIVITY_MULTIPLIERS.moderate },
    { label: t.activity.heavy, value: ACTIVITY_MULTIPLIERS.heavy },
    { label: t.activity.athlete, value: ACTIVITY_MULTIPLIERS.athlete },
  ] as const;
  const genderOptions = [
    { label: t.form.male, value: "M" },
    { label: t.form.female, value: "F" },
  ] as const;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCalculate();
  };

  return (
    <form ref={formRef} className="w-full" noValidate onSubmit={handleSubmit}>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
          {t.form.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t.form.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {t.form.description}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-700">
            {t.form.gender}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {genderOptions.map((option) => {
              const isSelected = profile.gender === option.value;

              return (
                <label
                  className={`focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-emerald-700 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/20"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                  key={option.value}
                >
                  <input
                    checked={isSelected}
                    className="sr-only"
                    name="gender"
                    onChange={() => onProfileChange("gender", option.value)}
                    type="radio"
                    value={option.value}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="age">
            {t.form.age}
          </label>
          <input
            aria-describedby={errors.age ? "age-error" : undefined}
            aria-invalid={Boolean(errors.age)}
            className={`${inputClassName} ${
              errors.age
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="age"
            min="20"
            max="78"
            step="1"
            onChange={(event) =>
              onProfileChange(
                "age",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            type="number"
            value={profile.age}
          />
          {errors.age && (
            <p
              className="mt-2 text-xs font-medium text-rose-600"
              id="age-error"
            >
              {message(errors.age)}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="weight"
          >
            {t.form.weight}{" "}
            <span className="font-normal text-slate-400">(kg)</span>
          </label>
          <input
            aria-describedby={errors.weight ? "weight-error" : undefined}
            aria-invalid={Boolean(errors.weight)}
            className={`${inputClassName} ${
              errors.weight
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="weight"
            min="0.1"
            onChange={(event) =>
              onProfileChange(
                "weight",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            step="0.1"
            type="number"
            value={profile.weight}
          />
          {errors.weight && (
            <p
              className="mt-2 text-xs font-medium text-rose-600"
              id="weight-error"
            >
              {message(errors.weight)}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="height"
          >
            {t.form.height}{" "}
            <span className="font-normal text-slate-400">(cm)</span>
          </label>
          <input
            aria-describedby={errors.height ? "height-error" : undefined}
            aria-invalid={Boolean(errors.height)}
            className={`${inputClassName} ${
              errors.height
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="height"
            min="0.1"
            onChange={(event) =>
              onProfileChange(
                "height",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            step="0.1"
            type="number"
            value={profile.height}
          />
          {errors.height && (
            <p
              className="mt-2 text-xs font-medium text-rose-600"
              id="height-error"
            >
              {message(errors.height)}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="activity"
          >
            {t.form.activityLevel}
          </label>
          <select
            aria-describedby={
              errors.activityMultiplier ? "activity-error" : undefined
            }
            aria-invalid={Boolean(errors.activityMultiplier)}
            className={`${inputClassName} ${
              errors.activityMultiplier
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="activity"
            onChange={(event) =>
              onProfileChange("activityMultiplier", Number(event.target.value))
            }
            value={profile.activityMultiplier}
          >
            {activityLevels.map((activity) => (
              <option key={activity.value} value={activity.value}>
                {activity.label}
              </option>
            ))}
          </select>
          {errors.activityMultiplier && (
            <p
              className="mt-2 text-xs font-medium text-rose-600"
              id="activity-error"
            >
              {message(errors.activityMultiplier)}
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        {language === "th"
          ? "สำหรับผู้ใหญ่อายุ 20–78 ปีที่ไม่ได้ตั้งครรภ์หรือให้นม ใช้เกณฑ์ BMI ผู้ใหญ่สากล ผลเป็นค่าประมาณ ไม่ใช่แผนโภชนาการเฉพาะบุคคล"
          : "For adults aged 20–78 who are not pregnant or breastfeeding. Uses international adult BMI categories. Estimates are not personalized nutrition prescriptions."}
      </p>
      <button
        className="mt-8 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[0.99]"
        type="submit"
      >
        {t.form.calculate}
      </button>
    </form>
  );
}
