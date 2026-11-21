"use client";

import { useId, useState, type FormEvent } from "react";
import type { Language } from "../../types";
import { announceAccountChange, useAccount } from "../../hooks/useAccount";
import { getWorkspaceTranslations } from "../../utils/workspace-translations";
import { apiErrorText, apiRequest } from "./client";

const inputStyle =
  "mt-1 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600";
const buttonStyle =
  "rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60";

export function AccountPanel({ language }: { language: Language }) {
  const t = getWorkspaceTranslations(language);
  const account = useAccount();
  const id = useId();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    try {
      await apiRequest(`/api/auth/${mode}/email`, {
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
      aria-labelledby={`${id}-heading`}
      className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="text-xl font-bold text-slate-950">
        {t.account}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t.accountHelp}</p>
      {account.loading ? (
        <p aria-live="polite" className="mt-4 text-sm text-slate-600">
          {t.loadingSession}
        </p>
      ) : account.user ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 break-all text-sm text-slate-700">
            {t.signedIn} <strong>{account.user.email}</strong>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 underline-offset-4 hover:underline"
              href={`/history?lang=${language}`}
            >
              {t.history}
            </a>
            <button
              data-testid="auth-signout"
              type="button"
              disabled={pending}
              onClick={() => void signOut()}
              className={buttonStyle}
            >
              {pending ? t.working : t.signOut}
            </button>
          </div>
        </div>
      ) : (
        <>
          {account.error && (
            <div role="alert" className="mt-4 text-sm text-rose-800">
              {t.sessionError}{" "}
              <button
                type="button"
                onClick={account.refresh}
                className="font-bold underline"
              >
                {t.retry}
              </button>
            </div>
          )}
          <div
            role="group"
            aria-label={t.account}
            className="mt-4 flex flex-wrap gap-2"
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
                onClick={() => {
                  setMode(item);
                  setError(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${mode === item ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}
              >
                {item === "sign-in" ? t.signIn : t.signUp}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => void submit(event)}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            {mode === "sign-up" && (
              <label
                className="text-sm font-semibold text-slate-700 sm:col-span-2"
                htmlFor={`${id}-name`}
              >
                {t.name}
                <input
                  id={`${id}-name`}
                  data-testid="auth-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  className={inputStyle}
                  disabled={pending}
                />
              </label>
            )}
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`${id}-email`}
            >
              {t.email}
              <input
                id={`${id}-email`}
                data-testid="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className={inputStyle}
                disabled={pending}
              />
            </label>
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`${id}-password`}
            >
              {t.password}
              <input
                id={`${id}-password`}
                data-testid="auth-password"
                name="password"
                type="password"
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                minLength={8}
                maxLength={128}
                required
                aria-describedby={`${id}-password-hint`}
                className={inputStyle}
                disabled={pending}
              />
            </label>
            <p
              id={`${id}-password-hint`}
              className="text-xs leading-5 text-slate-600 sm:col-span-2"
            >
              {t.passwordHint}
            </p>
            <button
              data-testid="auth-submit"
              type="submit"
              disabled={pending}
              className={`${buttonStyle} sm:col-span-2`}
            >
              {pending ? t.working : mode === "sign-in" ? t.signIn : t.signUp}
            </button>
          </form>
        </>
      )}
      {error !== null && (
        <p role="alert" className="mt-4 text-sm font-medium text-rose-800">
          {apiErrorText(error, language)}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-600">{t.privacy}</p>
    </section>
  );
}
