"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { ACTIVITY_MULTIPLIERS } from "../../core/calculator";
import type {
  ValidationErrors,
  ValidationErrorCode,
} from "../../core/validation";
import { PROFILE_LIMITS } from "../../core/policy";

import type { Language, UserProfile, FormProfile } from "../../types";
import { getTranslations } from "../../utils/translations";

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

const inputClassName = "hm-input";

export function HealthForm({
  errors,
  language,
  profile,
  onCalculate,
  onProfileChange,
}: HealthFormProps) {
  const t = getTranslations(language);
  const formRef = useRef<HTMLFormElement>(null);
  const focusAfterSubmit = useRef(false);
  useEffect(() => {
    if (!focusAfterSubmit.current) return;
    focusAfterSubmit.current = false;
    if (Object.keys(errors).length)
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [errors]);
  const message = (code: ValidationErrorCode) => t.validation[code];
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
    focusAfterSubmit.current = true;
    onCalculate();
  };

  return (
    <form ref={formRef} className="w-full" noValidate onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="hm-section-heading">{t.form.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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
                  className={`focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-emerald-700 cursor-pointer rounded-lg border px-4 py-3 text-center text-sm font-semibold transition ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
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
            aria-describedby={errors.age ? "age-hint age-error" : "age-hint"}
            aria-invalid={Boolean(errors.age)}
            className={`${inputClassName} ${
              errors.age
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="age"
            name="age"
            autoComplete="off"
            inputMode="numeric"
            min={PROFILE_LIMITS.age.min}
            max={PROFILE_LIMITS.age.max}
            step={PROFILE_LIMITS.age.step}
            onChange={(event) =>
              onProfileChange(
                "age",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            type="number"
            value={profile.age}
          />
          <p id="age-hint" className="mt-2 text-sm text-slate-600">
            {t.form.ageHint}
          </p>
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
            <span className="font-normal text-slate-600">(kg)</span>
          </label>
          <input
            aria-describedby={
              errors.weight ? "weight-hint weight-error" : "weight-hint"
            }
            aria-invalid={Boolean(errors.weight)}
            className={`${inputClassName} ${
              errors.weight
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="weight"
            name="weight"
            autoComplete="off"
            inputMode="decimal"
            min={PROFILE_LIMITS.weight.min}
            max={PROFILE_LIMITS.weight.max}
            onChange={(event) =>
              onProfileChange(
                "weight",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            step={PROFILE_LIMITS.weight.step}
            type="number"
            value={profile.weight}
          />
          <p id="weight-hint" className="mt-2 text-sm text-slate-600">
            {t.form.weightHint}
          </p>
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
            <span className="font-normal text-slate-600">(cm)</span>
          </label>
          <input
            aria-describedby={
              errors.height ? "height-hint height-error" : "height-hint"
            }
            aria-invalid={Boolean(errors.height)}
            className={`${inputClassName} ${
              errors.height
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
            }`}
            id="height"
            name="height"
            autoComplete="off"
            inputMode="decimal"
            min={PROFILE_LIMITS.height.min}
            max={PROFILE_LIMITS.height.max}
            onChange={(event) =>
              onProfileChange(
                "height",
                event.target.value === "" ? "" : Number(event.target.value),
              )
            }
            step={PROFILE_LIMITS.height.step}
            type="number"
            value={profile.height}
          />
          <p id="height-hint" className="mt-2 text-sm text-slate-600">
            {t.form.heightHint}
          </p>
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
            name="activityMultiplier"
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
        {t.form.eligibility}
      </p>
      <button className="hm-button mt-6 w-full" type="submit">
        {t.form.calculate}
      </button>
    </form>
  );
}
