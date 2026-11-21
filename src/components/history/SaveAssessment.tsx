"use client";

import { useId, useState, type FormEvent } from "react";
import type { HealthResult, Language, UserProfile } from "../../types";
import { useAccount, announceAccountChange } from "../../hooks/useAccount";
import {
  getWorkspaceTranslations,
  todayLocal,
  validMeasurementDate,
} from "../../utils/workspace-translations";
import { ApiError, apiErrorText, apiRequest } from "../account/client";

interface SaveAssessmentProps {
  language: Language;
  profile: UserProfile;
  result: HealthResult;
}

export function SaveAssessment(props: SaveAssessmentProps) {
  const account = useAccount();
  return (
    <SaveAssessmentContent
      key={`${account.user?.id ?? "signed-out"}:${account.loading}:${JSON.stringify(props.profile)}`}
      {...props}
      account={account}
    />
  );
}

function SaveAssessmentContent({
  language,
  profile,
  result,
  account,
}: SaveAssessmentProps & { account: ReturnType<typeof useAccount> }) {
  const t = getWorkspaceTranslations(language);
  const { user, loading, error: sessionError, refresh } = account;
  const id = useId();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    if (!title.trim() || title.trim().length > 120) {
      setError("TITLE_INVALID");
      event.currentTarget
        .querySelector<HTMLInputElement>('[name="title"]')
        ?.focus();
      return;
    }
    if (!validMeasurementDate(date)) {
      setError("DATE_INVALID");
      event.currentTarget
        .querySelector<HTMLInputElement>('[name="measuredAt"]')
        ?.focus();
      return;
    }
    setPending(true);
    try {
      await apiRequest("/api/assessments", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          measuredAt: date,
          profile,
        }),
      });
      setSaved(true);
    } catch (cause) {
      setError(cause);
      if (cause instanceof ApiError && cause.status === 401)
        announceAccountChange();
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="text-xl font-bold text-slate-950">
        {t.saveTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t.saveHelp}</p>
      <p className="mt-3 text-sm font-semibold text-emerald-800">
        {t.estimatedEnergy}:{" "}
        {new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
          maximumFractionDigits: 1,
        }).format(result.tdee)}{" "}
        kcal/day
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-600">{t.loadingSession}</p>
      ) : !user ? (
        <div className="mt-4 text-sm text-slate-700">
          <p>{sessionError ? t.sessionError : t.authRequired}</p>
          {sessionError && (
            <button
              type="button"
              onClick={refresh}
              className="mr-4 mt-3 font-bold text-emerald-800 underline"
            >
              {t.retry}
            </button>
          )}
          <a
            href="#account"
            className="mt-3 inline-block font-bold text-emerald-800 underline underline-offset-4"
          >
            {t.signIn}
          </a>
        </div>
      ) : (
        <form
          data-testid="save-assessment-form"
          onSubmit={(event) => void submit(event)}
          noValidate
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label
            htmlFor={`${id}-title`}
            className="text-sm font-semibold text-slate-700"
          >
            {t.title}
            <input
              id={`${id}-title`}
              name="title"
              data-testid="save-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSaved(false);
              }}
              required
              maxLength={120}
              placeholder={t.titlePlaceholder}
              disabled={pending}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>
          <label
            htmlFor={`${id}-date`}
            className="min-w-0 text-sm font-semibold text-slate-700"
          >
            {t.measuredAt}
            <input
              id={`${id}-date`}
              name="measuredAt"
              data-testid="save-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSaved(false);
              }}
              max={todayLocal()}
              required
              disabled={pending}
              className="mt-1 w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>
          <button
            data-testid="save-assessment-submit"
            type="submit"
            disabled={pending || saved}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60 sm:col-span-2"
          >
            {pending ? t.working : t.save}
          </button>
        </form>
      )}
      {error !== null && (
        <p role="alert" className="mt-4 text-sm font-medium text-rose-800">
          {error === "TITLE_INVALID"
            ? t.titleError
            : error === "DATE_INVALID"
              ? t.dateError
              : apiErrorText(error, language)}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mt-4 text-sm font-semibold text-emerald-800"
        >
          {t.saved}
        </p>
      )}
      <a
        href={`/history?lang=${language}`}
        className="mt-4 inline-block text-sm font-bold text-emerald-800 underline underline-offset-4"
      >
        {t.history}
      </a>
    </section>
  );
}
