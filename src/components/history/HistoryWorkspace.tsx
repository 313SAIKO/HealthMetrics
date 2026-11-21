"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
import { AccountPanel } from "../account/AccountPanel";
import { ApiError, apiErrorText, apiRequest } from "../account/client";
import { ResultCard } from "../health/ResultCard";
import { AssessmentComparison } from "./AssessmentComparison";
import { AssessmentEditor } from "./AssessmentEditor";

const actionStyle =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50";

export function HistoryWorkspace({
  initialLanguage,
}: {
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const t = getWorkspaceTranslations(language);
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
    document.documentElement.lang = language;
  }, [language]);
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
  function changeLanguage(next: Language) {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  }
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
    <main
      lang={language}
      className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <a
            href={`/?lang=${language}`}
            className="text-xl font-black tracking-tight text-emerald-800"
          >
            H+ HealthMetrics
          </a>
          <div
            role="group"
            aria-label={language === "th" ? "เลือกภาษา" : "Language selector"}
            className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1"
          >
            {(["en", "th"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                aria-pressed={language === locale}
                onClick={() => changeLanguage(locale)}
                className={`rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${language === locale ? "bg-emerald-700 text-white" : "text-slate-600"}`}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <div>
          <a
            href={`/?lang=${language}`}
            className="text-sm font-bold text-emerald-800 underline underline-offset-4"
          >
            ← {t.back}
          </a>
          <h1
            id="history-heading"
            tabIndex={-1}
            className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            {t.history}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {t.historyHelp}
          </p>
        </div>
        <AccountPanel language={language} />
        {account.loading ? (
          <p aria-live="polite" className="text-sm text-slate-600">
            {t.loadingSession}
          </p>
        ) : !account.user ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            {t.authRequired}{" "}
            <a href="#account" className="font-bold text-emerald-800 underline">
              {t.signIn}
            </a>
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">{t.privateHistory}</p>
            <form
              onSubmit={filter}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-end gap-3">
                <label
                  htmlFor="filter-from"
                  className="min-w-0 w-full text-sm font-semibold text-slate-700 sm:flex-1"
                >
                  {t.from}
                  <input
                    id="filter-from"
                    data-testid="filter-from"
                    type="date"
                    value={draftDates.from}
                    onChange={(event) =>
                      setDraftDates({ ...draftDates, from: event.target.value })
                    }
                    className="mt-1 block w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </label>
                <label
                  htmlFor="filter-to"
                  className="min-w-0 w-full text-sm font-semibold text-slate-700 sm:flex-1"
                >
                  {t.to}
                  <input
                    id="filter-to"
                    data-testid="filter-to"
                    type="date"
                    value={draftDates.to}
                    onChange={(event) =>
                      setDraftDates({ ...draftDates, to: event.target.value })
                    }
                    className="mt-1 block w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </label>
                <button
                  data-testid="filter-apply"
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  {t.filter}
                </button>
                <button
                  data-testid="filter-clear"
                  type="button"
                  className={actionStyle}
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
            </form>
            <section aria-label={t.compare} className="space-y-3">
              <p className="text-sm leading-6 text-slate-600">
                {t.compareHelp}
              </p>
              {selected.length === 2 ? (
                <AssessmentComparison
                  records={selected as [Assessment, Assessment]}
                  language={language}
                  onClear={() => setSelection({ owner, items: [] })}
                />
              ) : selected.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="min-w-0 break-words text-sm text-emerald-900">
                    1/2: {selected[0].title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelection({ owner, items: [] })}
                    className="text-sm font-bold text-emerald-800 underline"
                  >
                    {t.clearComparison}
                  </button>
                </div>
              ) : null}
              {selected.length === 2 && (
                <p className="text-xs text-slate-600">{t.compareLimit}</p>
              )}
            </section>
            {notice && (
              <p
                role="status"
                className="rounded-xl bg-emerald-100 p-3 text-sm font-semibold text-emerald-900"
              >
                {t[notice]}
              </p>
            )}
            {mutationError !== null && (
              <p role="alert" className="text-sm font-medium text-rose-800">
                {apiErrorText(mutationError, language)}
              </p>
            )}
            {loading ? (
              <p
                role="status"
                className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600"
              >
                {t.loadingRecords}
              </p>
            ) : response.error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-white p-5"
              >
                <p className="text-sm text-rose-800">
                  {t.loadError} {apiErrorText(response.error, language)}
                </p>
                <button
                  onClick={() => setRevision((value) => value + 1)}
                  type="button"
                  className={`${actionStyle} mt-4`}
                >
                  {t.retry}
                </button>
              </div>
            ) : data?.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                <h2 className="text-xl font-bold">
                  {query.from || query.to ? t.noFiltered : t.noRecords}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{t.noRecordsHelp}</p>
                <a
                  href={`/?lang=${language}#calculator`}
                  className="mt-4 inline-block text-sm font-bold text-emerald-800 underline"
                >
                  {t.back}
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  {data?.total ?? 0} {t.records}
                </p>
                {data?.items.map((item) => {
                  const checked = selected.some(
                    (record) => record.id === item.id,
                  );
                  return (
                    <article
                      key={item.id}
                      data-testid="assessment-card"
                      data-assessment-id={item.id}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h2 className="break-words text-xl font-bold text-slate-950">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {t.measuredAt}:{" "}
                            <time dateTime={item.measuredAt}>
                              {formatMeasurementDate(item.measuredAt, language)}
                            </time>
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.profile.weight} kg · {item.profile.height} cm
                            · BMI{" "}
                            {new Intl.NumberFormat(
                              language === "th" ? "th-TH" : "en-US",
                              { maximumFractionDigits: 2 },
                            ).format(item.result.bmi)}
                          </p>
                        </div>
                        <label
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${checked ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-300 text-slate-700"}`}
                        >
                          <input
                            data-testid="compare-select"
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && selected.length === 2}
                            onChange={() => toggleComparison(item)}
                            aria-label={`${t.compare}: ${item.title}`}
                            className="size-4 accent-emerald-700"
                          />
                          {t.compare}
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          data-testid="view-assessment"
                          type="button"
                          aria-expanded={detailId === item.id}
                          aria-controls={`snapshot-${item.id}`}
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
                          className={`${actionStyle} text-rose-800`}
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
                          aria-label={`${t.confirmDelete} ${item.title}`}
                          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"
                        >
                          <p className="font-bold text-rose-900">
                            {t.confirmDelete}
                          </p>
                          <p className="mt-1 break-words text-sm text-rose-800">
                            {item.title} — {t.deleteHelp}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              data-testid="confirm-delete"
                              type="button"
                              disabled={pendingDelete}
                              onClick={() => void remove(item)}
                              className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
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
                                    `[data-assessment-id="${CSS.escape(item.id)}"] [data-testid="delete-assessment"]`,
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
                                `[data-assessment-id="${CSS.escape(item.id)}"] [data-testid="edit-assessment"]`,
                              )
                              ?.focus();
                          }}
                        />
                      )}
                      {detailId === item.id && (
                        <div
                          id={`snapshot-${item.id}`}
                          className="mt-5 min-w-0 border-t border-slate-200 pt-5"
                        >
                          <h3 className="text-lg font-bold">{t.snapshot}</h3>
                          <p className="mb-4 mt-2 break-words text-xs text-slate-600">
                            {t.version}: {item.formulaVersion} · {t.savedAt}:{" "}
                            {formatMeasurementDate(
                              item.createdAt.slice(0, 10),
                              language,
                            )}
                          </p>
                          <ResultCard
                            language={language}
                            result={item.result}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
                {data && (
                  <nav
                    aria-label={t.page}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <button
                      data-testid="previous-page"
                      type="button"
                      className={actionStyle}
                      disabled={query.page <= 1}
                      onClick={() =>
                        setQuery({ ...query, page: query.page - 1 })
                      }
                    >
                      {t.previous}
                    </button>
                    <p className="text-sm text-slate-600">
                      {t.page} {query.page} /{" "}
                      {Math.max(1, Math.ceil(data.total / data.pageSize))}
                    </p>
                    <button
                      data-testid="next-page"
                      type="button"
                      className={actionStyle}
                      disabled={query.page * data.pageSize >= data.total}
                      onClick={() =>
                        setQuery({ ...query, page: query.page + 1 })
                      }
                    >
                      {t.next}
                    </button>
                  </nav>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
