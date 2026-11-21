"use client";

import { HealthForm } from "../components/health/HealthForm";
import { ResultCard } from "../components/health/ResultCard";
import { useHealthCalculator } from "../hooks/useHealthCalculator";
import type { Language } from "../types";
import { getTranslations } from "../utils/translations";

interface ResultPlaceholderProps {
  language: Language;
}

function ResultPlaceholder({ language }: ResultPlaceholderProps) {
  const t = getTranslations(language);

  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
        ✦
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
        {t.page.resultPlaceholderTitle}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
        {t.page.resultPlaceholderDescription}
      </p>

      <div className="mt-8 space-y-3">
        {[t.results.bmi, t.results.bmr, t.results.tdee].map((label) => (
          <div
            className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3"
            key={label}
          >
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="h-5 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const {
    calculate,
    errors,
    language,
    profile,
    result,
    setLanguage,
    updateProfile,
  } = useHealthCalculator();
  const t = getTranslations(language);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_32%)]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-5 pb-12 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <header className="flex items-center justify-between">
          <a className="flex items-center gap-3" href="#calculator">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-600/25">
              H+
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              HealthMetrics
            </span>
          </a>
          <div
            aria-label={language === "th" ? "เลือกภาษา" : "Language selector"}
            className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
            role="group"
          >
            <button
              aria-pressed={language === "en"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                language === "en"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
              onClick={() => setLanguage("en")}
              type="button"
            >
              {t.common.english}
            </button>
            <button
              aria-pressed={language === "th"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                language === "th"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
              onClick={() => setLanguage("th")}
              type="button"
            >
              {t.common.thai}
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-3xl pb-10 pt-16 text-center sm:pb-14 sm:pt-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
            {t.page.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl flex flex-col items-center">
            <span>{t.page.titleStart}</span>
            <span className="mt-2 text-emerald-600">
              {t.page.titleHighlight}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {t.page.subtitle}
          </p>
        </section>

        <div
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 flex flex-col lg:flex-row items-stretch"
          id="calculator"
        >
          {/* Left Pane (HealthForm) */}
          <div className="w-full lg:w-[420px] shrink-0 bg-white p-5 sm:p-8 flex flex-col justify-start">
            <HealthForm
              errors={errors}
              language={language}
              onCalculate={calculate}
              onProfileChange={updateProfile}
              profile={profile}
            />
          </div>
          {/* Right Pane (ResultCard / ResultPlaceholder) */}
          <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-6 border-t lg:border-t-0 lg:border-l border-slate-200/60">
            {result ? (
              <ResultCard language={language} result={result} />
            ) : (
              <ResultPlaceholder language={language} />
            )}
          </div>
        </div>

        <footer className="mt-10 text-center text-xs leading-5 text-slate-500">
          {t.page.footer}
        </footer>
      </div>
    </main>
  );
}
