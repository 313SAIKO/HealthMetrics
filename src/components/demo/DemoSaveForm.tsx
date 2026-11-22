"use client";

import { useId, useState, type FormEvent } from "react";
import type { Language, UserProfile } from "../../types";
import type { AssessmentInput } from "../../types/assessment";
import {
  getWorkspaceTranslations,
  todayLocal,
  validMeasurementDate,
} from "../../utils/workspace-translations";
import { demoCopy } from "./copy";

export function DemoSaveForm({
  language,
  profile,
  onAdd,
}: {
  language: Language;
  profile: UserProfile;
  onAdd: (input: AssessmentInput) => void;
}) {
  const text = demoCopy[language];
  const workspace = getWorkspaceTranslations(language);
  const id = useId();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [error, setError] = useState<"title" | "date" | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid =
      !title.trim() || title.trim().length > 120
        ? "title"
        : !validMeasurementDate(date)
          ? "date"
          : null;
    setError(invalid);
    if (invalid) {
      event.currentTarget
        .querySelector<HTMLInputElement>(
          invalid === "title" ? '[name="demo-title"]' : '[name="demo-date"]',
        )
        ?.focus();
      return;
    }
    onAdd({ title: title.trim(), measuredAt: date, profile: { ...profile } });
  }
  return (
    <section
      className="hm-surface p-5 sm:p-6"
      aria-labelledby={id + "-heading"}
    >
      <h2 id={id + "-heading"} className="hm-section-heading">
        {text.saveHeading}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text.saveHelp}</p>
      <form
        data-testid="demo-save-form"
        noValidate
        onSubmit={submit}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label
          htmlFor={id + "-title"}
          className="min-w-0 text-sm font-medium text-slate-700"
        >
          {text.titleLabel}
          <input
            id={id + "-title"}
            name="demo-title"
            data-testid="demo-save-title"
            autoComplete="off"
            maxLength={120}
            required
            value={title}
            placeholder={text.titlePlaceholder}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={error === "title"}
            aria-describedby={error === "title" ? id + "-error" : undefined}
            className="hm-input mt-2"
          />
        </label>
        <label
          htmlFor={id + "-date"}
          className="min-w-0 text-sm font-medium text-slate-700"
        >
          {text.date}
          <input
            id={id + "-date"}
            name="demo-date"
            data-testid="demo-save-date"
            type="date"
            autoComplete="off"
            required
            max={todayLocal()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={error === "date"}
            aria-describedby={error === "date" ? id + "-error" : undefined}
            className="hm-input mt-2"
          />
        </label>
        {error && (
          <p
            id={id + "-error"}
            role="alert"
            className="text-sm text-rose-800 sm:col-span-2"
          >
            {error === "title" ? workspace.titleError : workspace.dateError}
          </p>
        )}
        <button
          type="submit"
          data-testid="demo-save-submit"
          className="hm-button sm:col-span-2 sm:justify-self-start"
        >
          {text.save}
        </button>
      </form>
    </section>
  );
}
