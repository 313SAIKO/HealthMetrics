"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Language } from "../../types";
import { announceAccountChange, useAccount } from "../../hooks/useAccount";
import { getWorkspaceTranslations } from "../../utils/workspace-translations";
import { apiErrorText, apiRequest } from "./client";

type AccountMode = "sign-in" | "sign-up";
const openAccountEvent = "healthmetrics:open-account";

const copy = {
  en: {
    summary: "Keep your measurements in one place.",
    close: "Close form",
    chooseMode: "Choose how to access your account",
  },
  th: {
    summary: "เก็บประวัติไว้กลับมาดูได้",
    close: "ปิดแบบฟอร์ม",
    chooseMode: "เลือกวิธีเข้าใช้บัญชี",
  },
};

const inputStyle = "hm-input mt-1 w-full min-w-0";
const modeStyle =
  "min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60";

/** Open the mounted inline account form; callers can retain a native #account link. */
export function openAccountPanel(mode: AccountMode = "sign-in"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(openAccountEvent, { detail: { mode } }));
}

interface AccountPanelProps {
  language: Language;
  showHistoryLink?: boolean;
}

export function AccountPanel({
  language,
  showHistoryLink = true,
}: AccountPanelProps) {
  const t = getWorkspaceTranslations(language);
  const text = copy[language];
  const account = useAccount();
  const id = useId();
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [focusRevision, setFocusRevision] = useState(0);
  const focusOnOpen = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const showForm = expanded && !account.loading && !account.user;

  const requestOpen = useCallback((nextMode: AccountMode) => {
    focusOnOpen.current = true;
    setMode(nextMode);
    setExpanded(true);
    setError(null);
    setFocusRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    function openRequested(event: Event) {
      const requestedMode = (event as CustomEvent<{ mode?: unknown }>).detail
        ?.mode;
      requestOpen(requestedMode === "sign-up" ? "sign-up" : "sign-in");
    }
    window.addEventListener(openAccountEvent, openRequested);
    return () => window.removeEventListener(openAccountEvent, openRequested);
  }, [requestOpen]);

  useEffect(() => {
    if (showForm && focusOnOpen.current) {
      focusOnOpen.current = false;
      (mode === "sign-up" ? nameRef.current : emailRef.current)?.focus();
    }
  }, [showForm, mode, focusRevision]);

  function close() {
    if (pending) return;
    focusOnOpen.current = false;
    setExpanded(false);
    toggleRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    try {
      await apiRequest("/api/auth/" + mode + "/email", {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email")).trim(),
          password: String(data.get("password")),
          ...(mode === "sign-up"
            ? { name: String(data.get("name")).trim() }
            : {}),
        }),
      });
      form.reset();
      setExpanded(false);
      announceAccountChange();
    } catch (cause) {
      setError(cause);
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError(null);
    try {
      await apiRequest("/api/auth/sign-out", { method: "POST", body: "{}" });
      requestOpen("sign-in");
      announceAccountChange();
    } catch (cause) {
      setError(cause);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      id="account"
      data-testid="account-panel"
      aria-labelledby={id + "-heading"}
      className="hm-surface scroll-mt-24"
    >
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-5">
        <div className="min-w-0 basis-full flex-1 sm:basis-0">
          <h2
            id={id + "-heading"}
            className="break-words text-base font-semibold text-slate-950"
          >
            {account.user && !account.loading
              ? account.user.name || t.account
              : t.account}
          </h2>
          {account.loading ? (
            <p role="status" className="mt-0.5 text-sm text-slate-600">
              {t.loadingSession}
            </p>
          ) : account.user ? (
            <p className="mt-0.5 break-all text-sm text-slate-600">
              {account.user.email}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-600">{text.summary}</p>
          )}
        </div>
        {!account.loading &&
          (account.user ? (
            <div className="flex flex-wrap items-center gap-2">
              {showHistoryLink && (
                <a
                  className="hm-button-secondary"
                  href={"/history?lang=" + language}
                >
                  {t.history}
                </a>
              )}
              <button
                data-testid="auth-signout"
                type="button"
                disabled={pending}
                onClick={() => void signOut()}
                className="hm-button-secondary"
              >
                {pending ? t.working : t.signOut}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                ref={toggleRef}
                data-testid="auth-toggle"
                type="button"
                aria-expanded={expanded}
                aria-controls={id + "-form"}
                disabled={pending}
                onClick={() => (expanded ? close() : requestOpen("sign-in"))}
                className={expanded ? "hm-button-secondary" : "hm-button"}
              >
                {expanded ? text.close : t.signIn}
              </button>
              {!expanded && (
                <button
                  data-testid="auth-create-account"
                  type="button"
                  onClick={() => requestOpen("sign-up")}
                  className="hm-button-secondary"
                >
                  {t.signUp}
                </button>
              )}
            </div>
          ))}
      </div>

      {account.error && (
        <div
          role="alert"
          className="border-t border-slate-200 px-4 py-3 text-sm text-rose-800 sm:px-5"
        >
          {t.sessionError}{" "}
          <button
            type="button"
            onClick={account.refresh}
            className="min-h-10 px-2 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {t.retry}
          </button>
        </div>
      )}

      <div
        id={id + "-form"}
        hidden={!showForm}
        className="border-t border-slate-200 px-4 py-5 sm:px-5"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <div
          role="group"
          aria-label={text.chooseMode}
          className="mb-5 flex flex-wrap gap-1"
        >
          {(["sign-in", "sign-up"] as const).map((item) => (
            <button
              key={item}
              data-testid={
                item === "sign-in" ? "auth-signin-mode" : "auth-signup-mode"
              }
              type="button"
              aria-pressed={mode === item}
              disabled={pending}
              onClick={() => requestOpen(item)}
              className={
                modeStyle +
                (mode === item
                  ? " bg-emerald-50 text-emerald-900"
                  : " text-slate-600")
              }
            >
              {item === "sign-in" ? t.signIn : t.signUp}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          aria-busy={pending}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label
            hidden={mode !== "sign-up"}
            className="text-sm font-semibold text-slate-700 sm:col-span-2"
            htmlFor={id + "-name"}
          >
            {t.name}
            <input
              ref={nameRef}
              id={id + "-name"}
              data-testid="auth-name"
              name="name"
              autoComplete="name"
              required={mode === "sign-up"}
              maxLength={80}
              className={inputStyle}
              disabled={pending || !showForm || mode !== "sign-up"}
            />
          </label>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor={id + "-email"}
          >
            {t.email}
            <input
              ref={emailRef}
              id={id + "-email"}
              data-testid="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              required
              maxLength={254}
              className={inputStyle}
              disabled={pending || !showForm}
            />
          </label>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor={id + "-password"}
          >
            {t.password}
            <input
              id={id + "-password"}
              data-testid="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              minLength={8}
              maxLength={128}
              required
              aria-describedby={id + "-password-hint"}
              className={inputStyle}
              disabled={pending || !showForm}
            />
          </label>
          <p
            id={id + "-password-hint"}
            className="text-sm leading-6 text-slate-600 sm:col-span-2"
          >
            {t.passwordHint}
          </p>
          <div className="sm:col-span-2">
            <button
              data-testid="auth-submit"
              type="submit"
              disabled={pending}
              className="hm-button w-full sm:w-auto"
            >
              {pending ? t.working : mode === "sign-in" ? t.signIn : t.signUp}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm leading-6 text-slate-600">{t.privacy}</p>
      </div>

      {error !== null && (
        <p
          role="alert"
          className="border-t border-slate-200 px-4 py-3 text-sm font-medium text-rose-800 sm:px-5"
        >
          {apiErrorText(error, language)}
        </p>
      )}
    </section>
  );
}
