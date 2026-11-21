"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Language } from "../../types";
import type {
  Assessment,
  AssessmentInput,
  AssessmentList,
} from "../../types/assessment";
import { announceAccountChange, useAccount } from "../../hooks/useAccount";
import {
  formatMeasurementDate,
  getWorkspaceTranslations,
} from "../../utils/workspace-translations";
import { AccountPanel, openAccountPanel } from "../account/AccountPanel";
import { ApiError, apiErrorText, apiRequest } from "../account/client";
import { ResultCard } from "../health/ResultCard";
import { AssessmentComparison } from "./AssessmentComparison";
import { AssessmentEditor } from "./AssessmentEditor";

const actionStyle = "hm-button-secondary";

export function HistoryWorkspace({
  initialLanguage,
}: {
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const account = useAccount();
  const t = getWorkspaceTranslations(language);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function changeLanguage(next: Language) {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  }
  return (
    <main lang={language} className="hm-page">
      <div className="hm-shell pb-12">
        <a href="#history-content" className="hm-skip-link">
          {language === "th" ? "ข้ามไปประวัติ" : "Skip to history"}
        </a>
        <header className="hm-app-header">
          <Link href={"/?lang=" + language} className="hm-brand" translate="no">
            <span className="hm-brand-mark" aria-hidden="true">
              H+
            </span>
            HealthMetrics
          </Link>
          <nav
            className="hm-nav"
            aria-label={language === "th" ? "เมนูหลัก" : "Main navigation"}
          >
            <Link href={"/?lang=" + language}>
              {language === "th" ? "เครื่องคำนวณ" : "Calculator"}
            </Link>
            <Link href={"/history?lang=" + language} aria-current="page">
              {language === "th" ? "ประวัติ" : "History"}
            </Link>
          </nav>
          <div
            role="group"
            aria-label={language === "th" ? "เลือกภาษา" : "Language selector"}
            className="hm-lang"
          >
            {(["en", "th"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                aria-pressed={language === locale}
                onClick={() => changeLanguage(locale)}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <div className="mt-5">
          <AccountPanel language={language} showHistoryLink={false} />
        </div>
        <div id="history-content" className="mt-8 mb-6">
          <h1
            id="history-heading"
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
          >
            {t.history}
          </h1>
          <p className="mt-2 max-w-prose text-base leading-7 text-slate-600">
            {language === "th"
              ? "ดูข้อมูลที่บันทึกไว้ กรองวันที่ และเปรียบเทียบสองรายการ"
              : "Revisit saved measurements, filter by date and compare two assessments."}
          </p>
        </div>
        <HistoryWorkspaceContent
          key={account.user?.id ?? "signed-out"}
          language={language}
        />
      </div>
    </main>
  );
}

/** Remount only account-owned drafts, notices and mutations when the owner changes. */
function HistoryWorkspaceContent({ language }: { language: Language }) {
  const t = getWorkspaceTranslations(language);
  const numberFormatter = new Intl.NumberFormat(
    language === "th" ? "th-TH" : "en-US",
    { maximumFractionDigits: 2 },
  );
  const account = useAccount();
  const owner = account.user?.id ?? "";
  const [query, setQuery] = useState({ from: "", to: "", page: 1 });
  const [draftDates, setDraftDates] = useState({ from: "", to: "" });
  const [filterError, setFilterError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [response, setResponse] = useState<{
    key: string;
    data: AssessmentList | null;
    error: unknown;
  }>({ key: "", data: null, error: null });
  const [selection, setSelection] = useState<{
    owner: string;
    items: Assessment[];
  }>({ owner: "", items: [] });
  const selected = selection.owner === owner ? selection.items : [];
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);
  const [notice, setNotice] = useState<"deleted" | "updated" | null>(null);
  const requestKey = JSON.stringify([owner, query, revision]);
  const loading = response.key !== requestKey;
  const data = response.key === requestKey ? response.data : null;
  const focusAfterLoad = useRef<{ owner: string; id: string | null } | null>(
    null,
  );
  useEffect(() => {
    const target = focusAfterLoad.current;
    if (!target || loading) return;
    focusAfterLoad.current = null;
    if (target.owner !== owner) return;
    const selector = target.id
      ? `[data-assessment-id="${CSS.escape(target.id)}"] [data-testid="edit-assessment"]`
      : '[data-testid="assessment-card"] [data-testid="view-assessment"]';
    (
      document.querySelector<HTMLElement>(selector) ??
      document.getElementById("history-heading")
    )?.focus();
  }, [loading, owner, response.key]);
  useEffect(() => {
    if (!owner) return;
    let active = true;
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: "20",
    });
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    void apiRequest<AssessmentList>(`/api/assessments?${params}`)
      .then((result) => {
        if (active) setResponse({ key: requestKey, data: result, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setResponse({ key: requestKey, data: null, error });
        if (error instanceof ApiError && error.status === 401)
          announceAccountChange();
      });
    return () => {
      active = false;
    };
  }, [owner, query, requestKey]);
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftDates.from && draftDates.to && draftDates.from > draftDates.to) {
      setFilterError(true);
      return;
    }
    setFilterError(false);
    setQuery({ ...draftDates, page: 1 });
    setSelection({ owner, items: [] });
    setDetailId(null);
    setEditingId(null);
  }
  function toggleComparison(item: Assessment) {
    setSelection({
      owner,
      items: selected.some((record) => record.id === item.id)
        ? selected.filter((record) => record.id !== item.id)
        : selected.length < 2
          ? [...selected, item]
          : selected,
    });
  }
  async function update(item: Assessment, input: AssessmentInput) {
    const updated = await apiRequest<Assessment>(
      `/api/assessments/${encodeURIComponent(item.id)}`,
      { method: "PATCH", body: JSON.stringify(input) },
    ).catch((error) => {
      if (error instanceof ApiError && error.status === 401)
        announceAccountChange();
      throw error;
    });
    setSelection((current) =>
      current.owner === owner
        ? {
            owner,
            items: current.items.map((record) =>
              record.id === updated.id ? updated : record,
            ),
          }
        : current,
    );
    setEditingId(null);
    setNotice("updated");
    focusAfterLoad.current = { owner, id: updated.id };
    setRevision((value) => value + 1);
  }
  async function remove(item: Assessment) {
    setPendingDelete(true);
    setMutationError(null);
    setNotice(null);
    try {
      await apiRequest(`/api/assessments/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      setSelection((current) =>
        current.owner === owner
          ? {
              owner,
              items: current.items.filter((record) => record.id !== item.id),
            }
          : current,
      );
      setDeletingId(null);
      setDetailId(null);
      setNotice("deleted");
      focusAfterLoad.current = { owner, id: null };
      if (data?.items.length === 1 && query.page > 1)
        setQuery({ ...query, page: query.page - 1 });
      else setRevision((value) => value + 1);
    } catch (error) {
      setMutationError(error);
      if (error instanceof ApiError && error.status === 401)
        announceAccountChange();
    } finally {
      setPendingDelete(false);
    }
  }
  return (
    <>
      {account.loading ? (
        <p
          aria-live="polite"
          className="hm-surface p-5 text-base text-slate-600"
        >
          {t.loadingSession}
        </p>
      ) : !account.user ? (
        <div className="hm-surface p-5 text-base leading-7 text-slate-700">
          <p>{t.authRequired}</p>
          <a
            href="#account"
            onClick={() => openAccountPanel()}
            className="mt-3 inline-block font-semibold text-emerald-800 underline underline-offset-4"
          >
            {t.signIn}
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={filter}
            aria-label={language === "th" ? "กรองประวัติ" : "Filter history"}
            className="hm-surface p-5 sm:p-6"
          >
            <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-[1fr_1fr_auto_auto]">
              <label
                htmlFor="filter-from"
                className="col-span-2 min-w-0 text-sm font-medium text-slate-700 sm:col-span-1"
              >
                {t.from}
                <input
                  id="filter-from"
                  data-testid="filter-from"
                  name="from"
                  autoComplete="off"
                  type="date"
                  value={draftDates.from}
                  onChange={(event) =>
                    setDraftDates({ ...draftDates, from: event.target.value })
                  }
                  className="hm-input mt-2"
                />
              </label>
              <label
                htmlFor="filter-to"
                className="col-span-2 min-w-0 text-sm font-medium text-slate-700 sm:col-span-1"
              >
                {t.to}
                <input
                  id="filter-to"
                  data-testid="filter-to"
                  name="to"
                  autoComplete="off"
                  type="date"
                  value={draftDates.to}
                  onChange={(event) =>
                    setDraftDates({ ...draftDates, to: event.target.value })
                  }
                  className="hm-input mt-2"
                />
              </label>
              <button
                data-testid="filter-apply"
                type="submit"
                className="hm-button"
              >
                {t.filter}
              </button>
              <button
                data-testid="filter-clear"
                type="button"
                className="hm-button-secondary"
                onClick={() => {
                  setDraftDates({ from: "", to: "" });
                  setQuery({ from: "", to: "", page: 1 });
                  setFilterError(false);
                }}
              >
                {t.reset}
              </button>
            </div>
            {filterError && (
              <p
                role="alert"
                className="mt-3 text-sm font-medium text-rose-800"
              >
                {t.invalidDates}
              </p>
            )}
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {t.privateHistory}
            </p>
          </form>
          {selected.length === 2 ? (
            <AssessmentComparison
              records={selected as [Assessment, Assessment]}
              language={language}
              onClear={() => setSelection({ owner, items: [] })}
            />
          ) : selected.length === 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="min-w-0 break-words text-sm leading-6 text-emerald-950">
                {language === "th"
                  ? "เลือกแล้ว 1 จาก 2 รายการ: "
                  : "Selected 1 of 2: "}
                <strong className="font-semibold">{selected[0].title}</strong>
              </p>
              <button
                type="button"
                onClick={() => setSelection({ owner, items: [] })}
                className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
              >
                {t.clearComparison}
              </button>
            </div>
          ) : null}
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950"
            >
              {t[notice]}
            </p>
          )}
          {mutationError !== null && (
            <p role="alert" className="text-sm font-medium text-rose-800">
              {apiErrorText(mutationError, language)}
            </p>
          )}
          <section
            aria-labelledby="history-list-heading"
            className="hm-surface min-w-0 overflow-hidden"
          >
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="history-list-heading" className="hm-section-heading">
                  {language === "th" ? "รายการที่บันทึก" : "Saved assessments"}
                </h2>
                {data && (
                  <p className="text-sm tabular-nums text-slate-600">
                    {data.total} {t.records}
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selected.length === 2 ? t.compareLimit : t.compareHelp}
              </p>
            </div>
            {loading ? (
              <p role="status" className="p-5 text-base text-slate-600 sm:p-6">
                {t.loadingRecords}
              </p>
            ) : response.error ? (
              <div role="alert" className="p-5 sm:p-6">
                <p className="text-base leading-7 text-rose-800">
                  {t.loadError} {apiErrorText(response.error, language)}
                </p>
                <button
                  onClick={() => setRevision((value) => value + 1)}
                  type="button"
                  className="hm-button-secondary mt-4"
                >
                  {t.retry}
                </button>
              </div>
            ) : data?.items.length === 0 ? (
              <div className="px-5 py-8 sm:px-6">
                <h3 className="text-lg font-semibold text-slate-950">
                  {query.from || query.to ? t.noFiltered : t.noRecords}
                </h3>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  {t.noRecordsHelp}
                </p>
                <Link
                  href={"/?lang=" + language + "#calculator"}
                  className="hm-button mt-4 inline-flex"
                >
                  {t.back}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {data?.items.map((item) => {
                  const checked = selected.some(
                    (record) => record.id === item.id,
                  );
                  return (
                    <article
                      key={item.id}
                      data-testid="assessment-card"
                      data-assessment-id={item.id}
                      className="min-w-0 px-5 py-5 sm:px-6 sm:py-6"
                    >
                      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                        <div className="min-w-0 w-full sm:w-auto sm:flex-1">
                          <h3 className="break-words text-lg font-semibold leading-7 text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {t.measuredAt}:{" "}
                            <time dateTime={item.measuredAt}>
                              {formatMeasurementDate(item.measuredAt, language)}
                            </time>
                          </p>
                          <p className="mt-2 text-sm leading-6 tabular-nums text-slate-700">
                            {numberFormatter.format(item.profile.weight)} kg ·{" "}
                            {numberFormatter.format(item.profile.height)} cm ·
                            BMI {numberFormatter.format(item.result.bmi)}
                          </p>
                        </div>
                        <label
                          className={
                            "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
                            (checked
                              ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                              : "border-slate-300 text-slate-700 hover:border-emerald-600")
                          }
                        >
                          <input
                            data-testid="compare-select"
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && selected.length === 2}
                            onChange={() => toggleComparison(item)}
                            aria-label={t.compare + ": " + item.title}
                            className="size-4 accent-emerald-800"
                          />
                          {t.compare}
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          data-testid="view-assessment"
                          type="button"
                          aria-expanded={detailId === item.id}
                          aria-controls={"snapshot-" + item.id}
                          className={actionStyle}
                          onClick={() =>
                            setDetailId(detailId === item.id ? null : item.id)
                          }
                        >
                          {detailId === item.id ? t.hide : t.view}
                        </button>
                        <button
                          data-testid="edit-assessment"
                          type="button"
                          aria-expanded={editingId === item.id}
                          className={actionStyle}
                          onClick={() => {
                            setEditingId(
                              editingId === item.id ? null : item.id,
                            );
                            setDeletingId(null);
                            setNotice(null);
                            setMutationError(null);
                          }}
                        >
                          {t.edit}
                        </button>
                        <button
                          data-testid="delete-assessment"
                          type="button"
                          className={actionStyle + " text-rose-800"}
                          disabled={pendingDelete}
                          onClick={() => {
                            setDeletingId(item.id);
                            setEditingId(null);
                            setMutationError(null);
                          }}
                        >
                          {t.remove}
                        </button>
                      </div>
                      {deletingId === item.id && (
                        <div
                          role="group"
                          aria-label={t.confirmDelete + " " + item.title}
                          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"
                        >
                          <p className="font-semibold text-rose-950">
                            {t.confirmDelete}
                          </p>
                          <p className="mt-1 break-words text-sm leading-6 text-rose-900">
                            {item.title} — {t.deleteHelp}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              data-testid="confirm-delete"
                              type="button"
                              disabled={pendingDelete}
                              onClick={() => void remove(item)}
                              className="rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:opacity-50"
                            >
                              {pendingDelete ? t.working : t.confirm}
                            </button>
                            <button
                              type="button"
                              disabled={pendingDelete}
                              onClick={() => {
                                setDeletingId(null);
                                document
                                  .querySelector<HTMLElement>(
                                    '[data-assessment-id="' +
                                      CSS.escape(item.id) +
                                      '"] [data-testid="delete-assessment"]',
                                  )
                                  ?.focus();
                              }}
                              className={actionStyle}
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}
                      {editingId === item.id && (
                        <AssessmentEditor
                          assessment={item}
                          language={language}
                          onSave={(input) => update(item, input)}
                          onCancel={() => {
                            setEditingId(null);
                            document
                              .querySelector<HTMLElement>(
                                '[data-assessment-id="' +
                                  CSS.escape(item.id) +
                                  '"] [data-testid="edit-assessment"]',
                              )
                              ?.focus();
                          }}
                        />
                      )}
                      {detailId === item.id && (
                        <div
                          id={"snapshot-" + item.id}
                          className="mt-6 min-w-0 border-t border-slate-200 pt-6"
                        >
                          <div className="mb-5">
                            <h4 className="text-base font-semibold text-slate-950">
                              {t.snapshot}
                            </h4>
                            <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                              {t.version}: {item.formulaVersion} · {t.savedAt}:{" "}
                              {formatMeasurementDate(
                                item.createdAt.slice(0, 10),
                                language,
                              )}
                            </p>
                          </div>
                          <ResultCard
                            language={language}
                            result={item.result}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {!loading && data && data.total > 0 && (
              <nav
                aria-label={t.page}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:px-6"
              >
                <button
                  data-testid="previous-page"
                  type="button"
                  className={actionStyle}
                  disabled={query.page <= 1}
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                >
                  {t.previous}
                </button>
                <p className="text-sm tabular-nums text-slate-600">
                  {t.page} {query.page} /{" "}
                  {Math.max(1, Math.ceil(data.total / data.pageSize))}
                </p>
                <button
                  data-testid="next-page"
                  type="button"
                  className={actionStyle}
                  disabled={query.page * data.pageSize >= data.total}
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                >
                  {t.next}
                </button>
              </nav>
            )}
          </section>
        </div>
      )}
    </>
  );
}
