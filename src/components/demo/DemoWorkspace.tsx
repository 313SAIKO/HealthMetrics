"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Language, UserProfile } from "../../types";
import type { Assessment, AssessmentInput } from "../../types/assessment";
import { calculateHealthResult } from "../../core/assessment";
import { createDemoAssessments } from "../../demo/fixtures";
import { useHealthCalculator } from "../../hooks/useHealthCalculator";
import {
  formatMeasurementDate,
  getWorkspaceTranslations,
} from "../../utils/workspace-translations";
import { HealthForm } from "../health/HealthForm";
import { ResultCard } from "../health/ResultCard";
import { AssessmentComparison } from "../history/AssessmentComparison";
import { AssessmentEditor } from "../history/AssessmentEditor";
import { DemoSaveForm } from "./DemoSaveForm";
import { demoCopy } from "./copy";

export function DemoWorkspace({
  initialLanguage = "th",
  standalone = false,
}: {
  initialLanguage?: Language;
  standalone?: boolean;
}) {
  const [session, setSession] = useState({
    language: initialLanguage,
    revision: 0,
  });
  return (
    <DemoSession
      key={session.revision}
      initialLanguage={session.language}
      standalone={standalone}
      resetNotice={session.revision > 0}
      onReset={(language) =>
        setSession((current) => ({ language, revision: current.revision + 1 }))
      }
    />
  );
}

function DemoSession({
  initialLanguage,
  standalone,
  resetNotice,
  onReset,
}: {
  initialLanguage: Language;
  standalone: boolean;
  resetNotice: boolean;
  onReset: (language: Language) => void;
}) {
  const calculator = useHealthCalculator(initialLanguage);
  const { language, setLanguage } = calculator;
  const text = demoCopy[language];
  const workspace = getWorkspaceTranslations(language);
  const [view, setView] = useState<"calculator" | "history">("history");
  const [records, setRecords] = useState(() =>
    createDemoAssessments(initialLanguage),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "demo-baseline",
    "demo-follow-up",
  ]);
  const [draftDates, setDraftDates] = useState({ from: "", to: "" });
  const [dates, setDates] = useState({ from: "", to: "" });
  const [filterError, setFilterError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    "resetDone" | "added" | "updated" | "deleted" | null
  >(resetNotice ? "resetDone" : null);
  const nextId = useRef(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<{
    id: string | null;
    action: "demo-edit" | "demo-delete" | "demo-view";
  } | null>(null);
  const selected = selectedIds
    .map((id) => records.find((record) => record.id === id))
    .filter((record): record is Assessment => Boolean(record));
  const filtered = records.filter(
    (record) =>
      (!dates.from || record.measuredAt >= dates.from) &&
      (!dates.to || record.measuredAt <= dates.to),
  );
  const number = new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 2,
  });
  useEffect(() => {
    if (resetNotice) headingRef.current?.focus();
  }, [resetNotice]);
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const record = Array.from(
      document.querySelectorAll<HTMLElement>("[data-demo-id]"),
    ).find((element) => element.dataset.demoId === target.id);
    (
      record?.querySelector<HTMLElement>(
        '[data-testid="' + target.action + '"]',
      ) ?? headingRef.current
    )?.focus();
  }, [records, editingId, deletingId, view]);
  function changeLanguage(next: Language) {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  }
  function toggleComparison(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 2
          ? [...current, id]
          : current,
    );
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftDates.from && draftDates.to && draftDates.from > draftDates.to) {
      setFilterError(true);
      return;
    }
    setFilterError(false);
    setDates({ ...draftDates });
    setSelectedIds([]);
    setDetailId(null);
    setEditingId(null);
  }
  function sort(items: Assessment[]) {
    return items.sort(
      (first, second) =>
        second.measuredAt.localeCompare(first.measuredAt) ||
        second.createdAt.localeCompare(first.createdAt),
    );
  }
  function add(input: AssessmentInput) {
    const id = "demo-created-" + nextId.current++;
    const timestamp = new Date().toISOString();
    const item: Assessment = {
      ...input,
      id,
      profile: { ...input.profile },
      result: calculateHealthResult(input.profile),
      formulaVersion: "demo-v1",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setRecords((current) => sort([item, ...current]));
    setDates({ from: "", to: "" });
    setDraftDates({ from: "", to: "" });
    setFilterError(false);
    setSelectedIds(
      records.some((record) => record.id === "demo-baseline")
        ? ["demo-baseline", id]
        : [id],
    );
    setNotice("added");
    setView("history");
    pendingFocus.current = { id: null, action: "demo-view" };
  }
  async function update(record: Assessment, input: AssessmentInput) {
    const updated: Assessment = {
      ...record,
      ...input,
      profile: { ...input.profile },
      result: calculateHealthResult(input.profile),
      formulaVersion: "demo-v1",
      updatedAt: new Date().toISOString(),
    };
    setRecords((current) =>
      sort(current.map((item) => (item.id === record.id ? updated : item))),
    );
    setEditingId(null);
    setNotice("updated");
    pendingFocus.current = { id: record.id, action: "demo-edit" };
  }
  function remove(record: Assessment) {
    pendingFocus.current = {
      id: records.find((item) => item.id !== record.id)?.id ?? null,
      action: "demo-view",
    };
    setRecords((current) => current.filter((item) => item.id !== record.id));
    setSelectedIds((current) => current.filter((id) => id !== record.id));
    setDeletingId(null);
    if (detailId === record.id) setDetailId(null);
    setNotice("deleted");
  }
  return (
    <main lang={language} className="hm-page">
      <a href="#demo-content" className="hm-skip-link">
        {text.skip}
      </a>
      <div className="hm-shell pb-12">
        <header className="hm-app-header">
          <a
            href={standalone ? "#demo-content" : "/?lang=" + language}
            className="hm-brand"
            translate="no"
          >
            <span className="hm-brand-mark" aria-hidden="true">
              H+
            </span>
            HealthMetrics
          </a>
          <div role="group" aria-label={text.title} className="hm-nav">
            {(["calculator", "history"] as const).map((item) => (
              <button
                key={item}
                type="button"
                data-testid={
                  item === "calculator"
                    ? "demo-calculator-tab"
                    : "demo-history-tab"
                }
                aria-pressed={view === item}
                onClick={() => setView(item)}
                className={
                  "min-h-11 rounded-lg px-3 py-2 text-sm font-semibold " +
                  (view === item
                    ? "bg-emerald-100 text-emerald-950"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {text[item]}
              </button>
            ))}
          </div>
          <div
            role="group"
            className="hm-lang"
            aria-label={language === "th" ? "เลือกภาษา" : "Language selector"}
          >
            {(["en", "th"] as const).map((locale) => (
              <button
                key={locale}
                data-testid={"demo-lang-" + locale}
                type="button"
                aria-pressed={language === locale}
                onClick={() => changeLanguage(locale)}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <section
          className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5"
          data-testid="demo-banner"
          aria-label={text.banner}
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
            <div className="min-w-0 w-full sm:w-auto sm:flex-1">
              <p className="font-semibold text-emerald-950">{text.banner}</p>
              <p className="mt-1 max-w-prose text-sm leading-6 text-emerald-900">
                {text.bannerHelp}
              </p>
            </div>
            <button
              type="button"
              data-testid="demo-reset"
              onClick={() => onReset(language)}
              className="hm-button-secondary"
            >
              {text.reset}
            </button>
          </div>
        </section>
        <div className="mb-6 mt-7">
          <h1
            id="demo-content"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold text-slate-950 sm:text-3xl"
          >
            {text.title}
          </h1>
          <p className="mt-2 max-w-prose text-base leading-7 text-slate-600">
            {text.description}
          </p>
        </div>
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-950"
          >
            {text[notice]}
          </p>
        )}
        {view === "calculator" ? (
          <section id="demo-calculator-view" className="hm-calculator-grid">
            <div className="hm-surface p-5 sm:p-6">
              <HealthForm
                language={language}
                errors={calculator.errors}
                profile={calculator.profile}
                onProfileChange={calculator.updateProfile}
                onCalculate={calculator.calculate}
              />
            </div>
            <div className="min-w-0">
              {calculator.result ? (
                <ResultCard
                  language={language}
                  result={calculator.result}
                  afterSummary={
                    <DemoSaveForm
                      key={JSON.stringify(calculator.profile)}
                      language={language}
                      profile={calculator.profile as UserProfile}
                      onAdd={add}
                    />
                  }
                />
              ) : (
                <div className="hm-surface p-6">
                  <h2 className="hm-section-heading">{text.calculator}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {text.noResult}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section
            id="demo-history-view"
            aria-label={text.history}
            className="space-y-6"
          >
            <div>
              <h2 className="hm-section-heading">{text.history}</h2>
              <p className="mt-2 max-w-prose text-sm leading-6 text-slate-600">
                {text.selectHelp}
              </p>
            </div>
            {selected.length === 2 ? (
              <AssessmentComparison
                records={selected as [Assessment, Assessment]}
                language={language}
                onClear={() => setSelectedIds([])}
              />
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                {text.comparisonHelp}{" "}
                {selected.length === 1 ? text.selectedOne : ""}
              </p>
            )}
            <form
              onSubmit={filter}
              aria-label={text.filterTitle}
              className="hm-surface p-5 sm:p-6"
            >
              <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                <label
                  htmlFor="demo-filter-from"
                  className="col-span-2 min-w-0 text-sm font-medium text-slate-700 sm:col-span-1"
                >
                  {workspace.from}
                  <input
                    id="demo-filter-from"
                    data-testid="demo-filter-from"
                    name="from"
                    type="date"
                    autoComplete="off"
                    value={draftDates.from}
                    onChange={(event) =>
                      setDraftDates({ ...draftDates, from: event.target.value })
                    }
                    className="hm-input mt-2"
                  />
                </label>
                <label
                  htmlFor="demo-filter-to"
                  className="col-span-2 min-w-0 text-sm font-medium text-slate-700 sm:col-span-1"
                >
                  {workspace.to}
                  <input
                    id="demo-filter-to"
                    data-testid="demo-filter-to"
                    name="to"
                    type="date"
                    autoComplete="off"
                    value={draftDates.to}
                    onChange={(event) =>
                      setDraftDates({ ...draftDates, to: event.target.value })
                    }
                    className="hm-input mt-2"
                  />
                </label>
                <button
                  type="submit"
                  data-testid="demo-filter-apply"
                  className="hm-button"
                >
                  {workspace.filter}
                </button>
                <button
                  type="button"
                  data-testid="demo-filter-clear"
                  className="hm-button-secondary"
                  onClick={() => {
                    setDates({ from: "", to: "" });
                    setDraftDates({ from: "", to: "" });
                    setFilterError(false);
                  }}
                >
                  {workspace.reset}
                </button>
              </div>
              {filterError && (
                <p role="alert" className="mt-3 text-sm text-rose-800">
                  {workspace.invalidDates}
                </p>
              )}
            </form>
            <section
              className="hm-surface min-w-0 overflow-hidden"
              aria-label={text.history}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
                <h3 className="text-lg font-semibold text-slate-950">
                  {text.history}
                </h3>
                <p className="text-sm tabular-nums text-slate-600">
                  {number.format(filtered.length)} {text.records}
                </p>
              </div>
              {filtered.length === 0 ? (
                <div className="p-5 sm:p-6">
                  <p className="font-semibold text-slate-950">{text.empty}</p>
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    {text.emptyHelp}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filtered.map((record) => {
                    const checked = selectedIds.includes(record.id);
                    return (
                      <article
                        key={record.id}
                        data-testid="demo-record"
                        data-demo-id={record.id}
                        className="min-w-0 p-5 sm:p-6"
                      >
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                          <div className="min-w-0 w-full sm:w-auto sm:flex-1">
                            <h4 className="break-words text-lg font-semibold leading-7 text-slate-950">
                              {record.title}
                            </h4>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {workspace.measuredAt}:{" "}
                              <time dateTime={record.measuredAt}>
                                {formatMeasurementDate(
                                  record.measuredAt,
                                  language,
                                )}
                              </time>
                            </p>
                            <p className="mt-2 text-sm leading-6 tabular-nums text-slate-700">
                              {number.format(record.profile.weight)} kg ·{" "}
                              {number.format(record.profile.height)} cm · BMI{" "}
                              {number.format(record.result.bmi)}
                            </p>
                          </div>
                          <label
                            className={
                              "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm " +
                              (checked
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                                : "border-slate-300 text-slate-700")
                            }
                          >
                            <input
                              type="checkbox"
                              data-testid="demo-compare-select"
                              checked={checked}
                              disabled={!checked && selectedIds.length === 2}
                              onChange={() => toggleComparison(record.id)}
                              aria-label={
                                workspace.compare + ": " + record.title
                              }
                              className="size-4 accent-emerald-800"
                            />
                            {workspace.compare}
                          </label>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid="demo-view"
                            aria-expanded={detailId === record.id}
                            aria-controls={"demo-snapshot-" + record.id}
                            onClick={() =>
                              setDetailId(
                                detailId === record.id ? null : record.id,
                              )
                            }
                            className="hm-button-secondary"
                          >
                            {detailId === record.id ? text.hide : text.view}
                          </button>
                          <button
                            type="button"
                            data-testid="demo-edit"
                            aria-expanded={editingId === record.id}
                            onClick={() => {
                              setEditingId(
                                editingId === record.id ? null : record.id,
                              );
                              setDeletingId(null);
                            }}
                            className="hm-button-secondary"
                          >
                            {text.edit}
                          </button>
                          <button
                            type="button"
                            data-testid="demo-delete"
                            onClick={() => {
                              setDeletingId(record.id);
                              setEditingId(null);
                            }}
                            className="hm-button-secondary text-rose-800"
                          >
                            {text.remove}
                          </button>
                        </div>
                        {deletingId === record.id && (
                          <div
                            role="group"
                            aria-label={text.confirm + " " + record.title}
                            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"
                          >
                            <p className="break-words font-semibold text-rose-950">
                              {text.confirm} {record.title}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                data-testid="demo-confirm-delete"
                                onClick={() => remove(record)}
                                className="hm-button-secondary text-rose-800"
                              >
                                {text.confirmDelete}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  pendingFocus.current = {
                                    id: record.id,
                                    action: "demo-delete",
                                  };
                                  setDeletingId(null);
                                }}
                                className="hm-button-secondary"
                              >
                                {text.cancel}
                              </button>
                            </div>
                          </div>
                        )}
                        {editingId === record.id && (
                          <AssessmentEditor
                            assessment={record}
                            language={language}
                            onSave={(input) => update(record, input)}
                            onCancel={() => {
                              pendingFocus.current = {
                                id: record.id,
                                action: "demo-edit",
                              };
                              setEditingId(null);
                            }}
                          />
                        )}
                        {detailId === record.id && (
                          <div
                            id={"demo-snapshot-" + record.id}
                            className="mt-6 min-w-0 border-t border-slate-200 pt-6"
                          >
                            <p className="mb-4 text-sm leading-6 text-slate-600">
                              {text.savedVersion}: {record.formulaVersion}
                            </p>
                            <ResultCard
                              language={language}
                              result={record.result}
                            />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        )}
        <footer className="mt-10 border-t border-slate-200 pt-5">
          <p className="max-w-prose text-sm leading-6 text-slate-600">
            {text.learn}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            <a
              href="https://github.com/313SAIKO/HealthMetrics"
              className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              {text.source}
            </a>
            {!standalone && (
              <a
                href={"/?lang=" + language}
                className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
              >
                {text.fullApp}
              </a>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
