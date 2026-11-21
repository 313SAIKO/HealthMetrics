"use client";

import { BMI_BOUNDARIES } from "../../core/policy";
import { useId, useState, type ReactNode } from "react";
import { ENERGY_PER_GRAM } from "../../core/calculator";

import type {
  HealthResult,
  IdealWeight,
  Language,
  Macronutrients,
  TDEEActivityTable,
  MacronutrientSplit,
  BMICategory,
} from "../../types";
import {
  getTranslations,
  type TranslationDictionary,
} from "../../utils/translations";

interface ResultCardProps {
  language: Language;
  result: HealthResult;
  afterSummary?: ReactNode;
}

type MacroGoal = keyof Macronutrients;

const ACTIVITY_ROWS: ReadonlyArray<keyof TDEEActivityTable> = [
  "basal",
  "sedentary",
  "light",
  "moderate",
  "heavy",
  "athlete",
];

const IDEAL_WEIGHT_FORMULAS: ReadonlyArray<keyof IdealWeight> = [
  "hamwi",
  "devine",
  "robinson",
  "miller",
];

const MACRO_DIETS = [
  { key: "moderateCarb" },
  { key: "lowerCarb" },
  { key: "higherCarb" },
] as const;

function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  }).format(value);
}

function formatBMI(value: number, language: Language): string {
  // Never display a rounded value on the other side of a category boundary.
  const rounded = Math.round(value * 100) / 100;
  const boundary = BMI_BOUNDARIES.find(
    (limit) => value < limit && rounded >= limit,
  );
  return boundary === undefined
    ? formatNumber(value, language)
    : `< ${formatNumber(boundary, language)}`;
}

function getBMICategoryClassName(category: BMICategory): string {
  if (category === "Normal weight") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
  }

  if (category === "Underweight") {
    return "bg-sky-100 text-sky-700 ring-sky-600/20";
  }

  return "bg-amber-100 text-amber-800 ring-amber-600/20";
}

function getBMICategoryLabel(
  category: string,
  translations: TranslationDictionary,
): string {
  switch (category) {
    case "Underweight":
      return translations.bmiCategory.underweight;
    case "Normal weight":
      return translations.bmiCategory.normalWeight;
    case "Overweight":
      return translations.bmiCategory.overweight;
    case "Obesity":
      return translations.bmiCategory.obesity;
    default:
      return category;
  }
}

function getMacroCalories(split: MacronutrientSplit): number {
  return (
    split.protein * ENERGY_PER_GRAM.protein +
    split.fat * ENERGY_PER_GRAM.fat +
    split.carbs * ENERGY_PER_GRAM.carbs
  );
}

export function ResultCard({
  language,
  result,
  afterSummary,
}: ResultCardProps) {
  const [selectedGoal, setSelectedGoal] = useState<MacroGoal>("maintenance");
  const id = useId();
  const t = getTranslations(language);
  const selectedMacroPlan = result.macronutrients[selectedGoal];
  const macroGoals: ReadonlyArray<MacroGoal> = [
    "maintenance",
    "cutting",
    "bulking",
  ];
  const goalLabel: Record<MacroGoal, string> = {
    maintenance: t.results.maintenance,
    cutting: t.results.cutting,
    bulking: t.results.bulking,
  };
  const goalDescription: Record<MacroGoal, string> = {
    maintenance: t.education.maintenance,
    cutting: t.education.cutting,
    bulking: t.education.bulking,
  };
  return (
    <section
      className="space-y-6"
      aria-live="polite"
      aria-labelledby={`${id}-results`}
    >
      <section className="hm-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id={`${id}-results`} className="hm-section-heading">
            {t.results.title}
          </h2>
          <span
            className={`rounded-md px-2.5 py-1 text-sm font-semibold ${getBMICategoryClassName(result.bmiCategory)}`}
          >
            {getBMICategoryLabel(result.bmiCategory, t)}
          </span>
        </div>
        <dl className="mt-6 grid gap-x-6 gap-y-5 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
          <div className="min-w-0">
            <dt className="hm-muted text-sm">{t.results.tdee}</dt>
            <dd className="hm-metric-value mt-2 text-emerald-900">
              {formatNumber(result.tdee, language)}
            </dd>
            <dd className="hm-muted mt-1 text-sm">{t.common.kcalPerDay}</dd>
          </div>
          <div className="min-w-0">
            <dt className="hm-muted text-sm">{t.results.bmr}</dt>
            <dd className="hm-metric-value mt-2">
              {formatNumber(result.bmr, language)}
            </dd>
            <dd className="hm-muted mt-1 text-sm">{t.common.kcalPerDay}</dd>
          </div>
          <div className="min-w-0">
            <dt className="hm-muted text-sm">{t.results.bmi}</dt>
            <dd className="hm-metric-value mt-2">
              {formatBMI(result.bmi, language)}
            </dd>
            <dd className="hm-muted mt-1 text-sm">kg/m²</dd>
          </div>
        </dl>
        <details className="mt-6 border-t border-slate-200 pt-4">
          <summary className="min-h-11 cursor-pointer rounded-sm py-2.5 text-sm font-semibold text-emerald-800">
            {t.results.formulaTitle}
          </summary>
          <dl className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">BMI</dt>
              <dd>
                {t.education.bmi} {t.results.bmiRoundingNote}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">BMR</dt>
              <dd>{t.education.bmr}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">TDEE</dt>
              <dd>{t.education.tdee}</dd>
            </div>
          </dl>
        </details>
      </section>
      {afterSummary}
      <section className="hm-surface p-5 sm:p-7">
        <h3 className="hm-section-heading">{t.results.activityTableTitle}</h3>
        <p className="hm-muted mt-2 text-sm leading-6">
          {t.results.activityTableDescription}
        </p>
        <table className="hm-data-table mt-4">
          <thead>
            <tr>
              <th scope="col">{t.form.activityLevel}</th>
              <th scope="col" className="text-right">
                {t.results.tdee}
              </th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY_ROWS.map((activity) => (
              <tr
                key={activity}
                className={
                  result.tdeeTable[activity] === result.tdee
                    ? "bg-emerald-50/60"
                    : ""
                }
              >
                <td className="leading-6">{t.activity[activity]}</td>
                <td className="whitespace-nowrap">
                  {formatNumber(result.tdeeTable[activity], language)}
                  <span className="hm-muted mt-0.5 block text-xs font-normal">
                    {t.common.kcalPerDay}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="hm-surface p-5 sm:p-7">
        <h3 className="hm-section-heading">{t.results.idealWeightTitle}</h3>
        <p className="hm-muted mt-2 text-sm leading-6">
          {t.results.idealWeightDescription}
        </p>
        <p className="hm-muted mt-3 text-sm leading-6">
          {t.education.idealWeight}
        </p>
        <table className="hm-data-table mt-4">
          <thead>
            <tr>
              <th scope="col">{t.results.formula}</th>
              <th scope="col" className="text-right">
                {t.results.estimatedWeight}
              </th>
            </tr>
          </thead>
          <tbody>
            {IDEAL_WEIGHT_FORMULAS.map((formula) => (
              <tr key={formula}>
                <td className="font-medium capitalize">{formula}</td>
                <td>
                  {result.idealWeight
                    ? `${formatNumber(result.idealWeight[formula], language)} kg`
                    : t.results.unsupportedHeight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="mt-4 border-t border-slate-200 pt-4">
          <summary className="min-h-11 cursor-pointer rounded-sm py-2.5 text-sm font-semibold text-emerald-800">
            {t.results.formulaTitle}
          </summary>
          <dl className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            {IDEAL_WEIGHT_FORMULAS.map((formula) => (
              <div key={formula}>
                <dt className="font-semibold capitalize text-slate-900">
                  {formula}
                </dt>
                <dd>{t.education[formula]}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>
      <section className="hm-surface p-5 sm:p-7">
        <h3 className="hm-section-heading">{t.results.macrosTitle}</h3>
        <p className="hm-muted mt-2 text-sm leading-7">
          {t.results.macrosDescription}
        </p>
        <div
          role="group"
          aria-label={t.results.macrosTitle}
          className="mt-5 grid grid-cols-1 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-3"
        >
          {macroGoals.map((goal) => (
            <button
              key={goal}
              type="button"
              aria-pressed={selectedGoal === goal}
              onClick={() => setSelectedGoal(goal)}
              className={`min-h-11 rounded-md px-1 py-2 text-sm font-semibold ${selectedGoal === goal ? "bg-white text-emerald-900" : "text-slate-600 hover:bg-slate-200"}`}
            >
              {goalLabel[goal]}
            </button>
          ))}
        </div>
        <p className="hm-muted mt-4 text-sm leading-6">
          {goalDescription[selectedGoal]}
        </p>
        {!selectedMacroPlan ? (
          <p
            role="status"
            className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-7 text-amber-900"
          >
            {t.results.withheldPlan}
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {MACRO_DIETS.map((diet) => {
              const split = selectedMacroPlan[diet.key];
              const totalCalories = getMacroCalories(split);
              const macros = [
                {
                  key: "protein" as const,
                  label: t.results.protein,
                  energy: ENERGY_PER_GRAM.protein,
                },
                {
                  key: "fat" as const,
                  label: t.results.fat,
                  energy: ENERGY_PER_GRAM.fat,
                },
                {
                  key: "carbs" as const,
                  label: t.results.carbs,
                  energy: ENERGY_PER_GRAM.carbs,
                },
              ];
              return (
                <article
                  key={diet.key}
                  className="border-t border-slate-200 pt-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-semibold text-slate-900">
                      {t.results[diet.key]}
                    </h4>
                    <p className="text-sm font-semibold tabular-nums text-emerald-900">
                      {formatNumber(totalCalories, language)} kcal
                    </p>
                  </div>
                  <dl className="mt-2 divide-y divide-slate-100">
                    {macros.map((macro) => (
                      <div
                        key={macro.key}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <dt className="min-w-0 text-sm text-slate-700">
                          <span className="block break-words font-medium">
                            {macro.label}
                          </span>
                          <span className="hm-muted text-xs">
                            {Math.round(
                              ((split[macro.key] * macro.energy) /
                                totalCalories) *
                                100,
                            )}
                            %
                          </span>
                        </dt>
                        <dd className="shrink-0 text-xl font-semibold tabular-nums text-slate-900">
                          {Math.round(split[macro.key])}{" "}
                          <span className="hm-muted text-sm font-normal">
                            {t.common.grams}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        )}
        <details className="mt-5 border-t border-slate-200 pt-4">
          <summary className="min-h-11 cursor-pointer rounded-sm py-2.5 text-sm font-semibold text-emerald-800">
            {t.results.formulaTitle}
          </summary>
          <p className="hm-muted mt-3 text-sm leading-7">
            {t.education.macros}
          </p>
        </details>
      </section>
      <p className="hm-muted px-1 text-sm leading-7">{t.results.disclaimer}</p>
    </section>
  );
}
