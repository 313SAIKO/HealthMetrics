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
import { openAccountPanel } from "../account/AccountPanel";

interface SaveAssessmentProps {
  language: Language;
  profile: UserProfile;
  result: HealthResult;
}

export function SaveAssessment(props: SaveAssessmentProps) {
  const account = useAccount();
  return (
    <SaveAssessmentContent
      key={`${account.user?.id ?? "signed-out"}:${JSON.stringify(props.profile)}`}
      {...props}
      account={account}
    />
  );
}

function SaveAssessmentContent({
  language,
  profile,
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
      className="hm-surface p-5 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="hm-section-heading">
        {t.saveTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t.saveHelp}</p>
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
            onClick={() => openAccountPanel()}
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
              autoComplete="off"
              aria-invalid={error === "TITLE_INVALID"}
              aria-describedby={
                error === "TITLE_INVALID" ? `${id}-error` : undefined
              }
              maxLength={120}
              placeholder={t.titlePlaceholder + "…"}
              disabled={pending}
              className="hm-input mt-2"
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
              autoComplete="off"
              aria-invalid={error === "DATE_INVALID"}
              aria-describedby={
                error === "DATE_INVALID" ? `${id}-error` : undefined
              }
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSaved(false);
              }}
              max={todayLocal()}
              required
              disabled={pending}
              className="hm-input mt-2"
            />
          </label>
          <button
            data-testid="save-assessment-submit"
            type="submit"
            disabled={pending || saved}
            className="hm-button sm:col-span-2 sm:justify-self-start"
          >
            {pending ? t.working : t.save}
          </button>
        </form>
      )}
      {error !== null && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-4 text-sm font-medium text-rose-800"
        >
          {error === "TITLE_INVALID"
            ? t.titleError
            : error === "DATE_INVALID"
              ? t.dateError
              : apiErrorText(error, language)}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 text-sm font-medium text-emerald-900">
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
