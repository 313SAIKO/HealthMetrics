"use client";

import Link from "next/link";
import { AccountPanel } from "../account/AccountPanel";
import { SaveAssessment } from "../history/SaveAssessment";
import { HealthForm } from "./HealthForm";
import { ResultCard } from "./ResultCard";
import { useHealthCalculator } from "../../hooks/useHealthCalculator";
import type { Language, UserProfile } from "../../types";
import { getTranslations } from "../../utils/translations";

function ResultPlaceholder({ language }: { language: Language }) {
  const t = getTranslations(language);
  return (
    <section
      className="hm-surface px-6 py-8 sm:px-8 sm:py-10"
      aria-labelledby="result-placeholder-heading"
    >
      <svg
        className="mb-6 text-emerald-800"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="5"
          y="3"
          width="30"
          height="34"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 12h16M12 20h6m-6 8h6m6-8h4m-4 8h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <h2 id="result-placeholder-heading" className="hm-section-heading">
        {t.page.resultPlaceholderTitle}
      </h2>
      <p className="hm-muted mt-3 max-w-lg text-base leading-7">
        {t.page.resultPlaceholderDescription}
      </p>
      <dl className="mt-8 divide-y divide-slate-200">
        {[t.results.bmi, t.results.bmr, t.results.tdee].map((label) => (
          <div
            className="flex items-center justify-between gap-4 py-4"
            key={label}
          >
            <dt className="hm-muted text-sm">{label}</dt>
            <dd aria-hidden="true" className="text-xl text-slate-400">
              —
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function HealthCalculator({
  initialLanguage = "th",
}: {
  initialLanguage?: Language;
}) {
  const {
    calculate,
    errors,
    language,
    profile,
    result,
    setLanguage,
    updateProfile,
  } = useHealthCalculator(initialLanguage);
  const t = getTranslations(language);
  const copy =
    language === "th"
      ? {
          calculator: "เครื่องคำนวณ",
          history: "ประวัติ",
          skip: "ข้ามไปยังเครื่องคำนวณ",
        }
      : {
          calculator: "Calculator",
          history: "History",
          skip: "Skip to calculator",
        };
  function changeLanguage(next: Language) {
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  }
  return (
    <main lang={language} className="hm-page">
      <a href="#calculator" className="hm-skip-link">
        {copy.skip}
      </a>
      <div className="hm-shell">
        <header className="hm-app-header">
          <Link href={`/?lang=${language}`} className="hm-brand" translate="no">
            <span className="hm-brand-mark" aria-hidden="true">
              H+
            </span>
            HealthMetrics
          </Link>
          <nav
            className="hm-nav"
            aria-label={language === "th" ? "เมนูหลัก" : "Main navigation"}
          >
            <Link href={`/?lang=${language}`} aria-current="page">
              {copy.calculator}
            </Link>
            <Link href={`/history?lang=${language}`}>{copy.history}</Link>
          </nav>
          <div
            className="hm-lang"
            role="group"
            aria-label={language === "th" ? "เลือกภาษา" : "Language selector"}
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
        <section className="hm-intro">
          <h1>
            {t.page.titleStart}
            <span className="block sm:ml-2 sm:inline">
              {t.page.titleHighlight}
            </span>
          </h1>
          <p>{t.page.subtitle}</p>
        </section>
        <AccountPanel language={language} showHistoryLink={false} />
        <div id="calculator" className="hm-calculator-grid">
          <section className="hm-surface p-5 sm:p-6">
            <HealthForm
              errors={errors}
              language={language}
              onCalculate={calculate}
              onProfileChange={updateProfile}
              profile={profile}
            />
          </section>
          <div className="min-w-0">
            {result ? (
              <div className="space-y-6">
                <ResultCard
                  language={language}
                  result={result}
                  afterSummary={
                    <SaveAssessment
                      language={language}
                      profile={profile as UserProfile}
                      result={result}
                    />
                  }
                />
              </div>
            ) : (
              <ResultPlaceholder language={language} />
            )}
          </div>
        </div>
        <footer className="hm-muted mt-10 border-t border-slate-200 pb-8 pt-5 text-sm leading-6">
          {t.page.footer}
        </footer>
      </div>
    </main>
  );
}
