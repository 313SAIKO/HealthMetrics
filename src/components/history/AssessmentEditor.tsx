"use client";

import { useId, useState, type FormEvent } from "react";
import type { FormProfile, Language } from "../../types";
import type { Assessment, AssessmentInput } from "../../types/assessment";
import { ACTIVITY_MULTIPLIERS } from "../../core/calculator";
import { PROFILE_LIMITS } from "../../core/policy";
import { validateProfile, type ValidationErrors } from "../../core/validation";
import { getTranslations } from "../../utils/translations";
import {
  getWorkspaceTranslations,
  todayLocal,
  validMeasurementDate,
} from "../../utils/workspace-translations";
import { apiErrorText } from "../account/client";

const inputStyle =
  "mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60";

export function AssessmentEditor({
  assessment,
  language,
  onSave,
  onCancel,
}: {
  assessment: Assessment;
  language: Language;
  onSave: (input: AssessmentInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = getWorkspaceTranslations(language);
  const health = getTranslations(language);
  const id = useId();
  const [profile, setProfile] = useState<FormProfile>(assessment.profile);
  const [title, setTitle] = useState(assessment.title);
  const [date, setDate] = useState(assessment.measuredAt);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [metadataError, setMetadataError] = useState<
    "title" | "measuredAt" | null
  >(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateProfile(profile);
    const invalidMetadata =
      !title.trim() || title.trim().length > 120
        ? "title"
        : !validMeasurementDate(date)
          ? "measuredAt"
          : null;
    setErrors(validation);
    setMetadataError(invalidMetadata);
    setError(null);
    const firstInvalid = invalidMetadata ?? Object.keys(validation)[0];
    if (firstInvalid) {
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }
    setPending(true);
    try {
      await onSave({
        title: title.trim(),
        measuredAt: date,
        profile: {
          ...profile,
          age: Number(profile.age),
          weight: Number(profile.weight),
          height: Number(profile.height),
        },
      });
    } catch (cause) {
      setError(cause);
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      data-testid="edit-assessment-form"
      aria-labelledby={`${id}-heading`}
      noValidate
      onSubmit={(event) => void submit(event)}
      className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-6"
    >
      <h3 id={`${id}-heading`} className="text-lg font-bold text-slate-950">
        {t.editTitle}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t.editHelp}</p>
      <fieldset
        disabled={pending}
        className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <legend className="sr-only">{t.editTitle}</legend>
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor={`${id}-title`}
        >
          {t.title}
          <input
            id={`${id}-title`}
            data-testid="edit-title"
            name="title"
            value={title}
            maxLength={120}
            required
            aria-invalid={metadataError === "title"}
            aria-describedby={
              metadataError === "title" ? `${id}-metadata-error` : undefined
            }
            onChange={(event) => setTitle(event.target.value)}
            className={inputStyle}
          />
        </label>
        <label
          className="min-w-0 text-sm font-semibold text-slate-700"
          htmlFor={`${id}-date`}
        >
          {t.measuredAt}
          <input
            id={`${id}-date`}
            data-testid="edit-date"
            name="measuredAt"
            type="date"
            max={todayLocal()}
            value={date}
            required
            aria-invalid={metadataError === "measuredAt"}
            aria-describedby={
              metadataError === "measuredAt"
                ? `${id}-metadata-error`
                : undefined
            }
            onChange={(event) => setDate(event.target.value)}
            className={inputStyle}
          />
        </label>
        {metadataError && (
          <p
            id={`${id}-metadata-error`}
            className="text-sm font-medium text-rose-800 sm:col-span-2"
          >
            {metadataError === "title" ? t.titleError : t.dateError}
          </p>
        )}
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor={`${id}-gender`}
        >
          {health.form.gender}
          <select
            id={`${id}-gender`}
            data-testid="edit-gender"
            name="gender"
            value={profile.gender}
            onChange={(event) =>
              setProfile({
                ...profile,
                gender: event.target.value as "M" | "F",
              })
            }
            className={inputStyle}
          >
            <option value="M">{health.form.male}</option>
            <option value="F">{health.form.female}</option>
          </select>
        </label>
        {(["age", "weight", "height"] as const).map((field) => (
          <div key={field}>
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`${id}-${field}`}
            >
              {t[field]}
            </label>
            <input
              id={`${id}-${field}`}
              data-testid={`edit-${field}`}
              name={field}
              type="number"
              min={PROFILE_LIMITS[field].min}
              max={PROFILE_LIMITS[field].max}
              step={PROFILE_LIMITS[field].step}
              required
              value={profile[field]}
              aria-invalid={Boolean(errors[field])}
              aria-describedby={`${id}-${field}-hint${errors[field] ? ` ${id}-${field}-error` : ""}`}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  [field]:
                    event.target.value === "" ? "" : Number(event.target.value),
                })
              }
              className={inputStyle}
            />
            <p
              id={`${id}-${field}-hint`}
              className="mt-1 text-xs text-slate-600"
            >
              {PROFILE_LIMITS[field].min}–{PROFILE_LIMITS[field].max}
            </p>
            {errors[field] && (
              <p
                id={`${id}-${field}-error`}
                className="mt-1 text-sm text-rose-800"
              >
                {health.validation[errors[field]]}
              </p>
            )}
          </div>
        ))}
        <label
          className="text-sm font-semibold text-slate-700 sm:col-span-2"
          htmlFor={`${id}-activity`}
        >
          {health.form.activityLevel}
          <select
            id={`${id}-activity`}
            data-testid="edit-activity"
            name="activityMultiplier"
            value={profile.activityMultiplier}
            onChange={(event) =>
              setProfile({
                ...profile,
                activityMultiplier: Number(event.target.value),
              })
            }
            className={inputStyle}
          >
            {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, value]) => (
              <option key={key} value={value}>
                {health.activity[key as keyof typeof ACTIVITY_MULTIPLIERS]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      {error !== null && (
        <p role="alert" className="mt-4 text-sm font-medium text-rose-800">
          {apiErrorText(error, language)}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          data-testid="edit-submit"
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"
        >
          {pending ? t.working : t.update}
        </button>
        <button
          data-testid="edit-cancel"
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
