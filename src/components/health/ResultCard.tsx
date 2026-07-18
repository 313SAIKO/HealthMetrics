'use client';

import { useState } from 'react';

import type {
  HealthResult,
  IdealWeight,
  Language,
  MacronutrientSplit,
  Macronutrients,
  TDEEActivityTable,
} from '../../types';
import {
  getTranslations,
  type TranslationDictionary,
} from '../../utils/translations';

interface ResultCardProps {
  language: Language;
  result: HealthResult;
}

type MacroGoal = keyof Macronutrients;

const ACTIVITY_ROWS: ReadonlyArray<keyof TDEEActivityTable> = [
  'basal',
  'sedentary',
  'light',
  'moderate',
  'heavy',
  'athlete',
];

const IDEAL_WEIGHT_FORMULAS: ReadonlyArray<keyof IdealWeight> = [
  'hamwi',
  'devine',
  'robinson',
  'miller',
];

const MACRO_DIETS = [
  { accent: 'bg-sky-500', key: 'moderateCarb', surface: 'bg-sky-50' },
  { accent: 'bg-violet-500', key: 'lowerCarb', surface: 'bg-violet-50' },
  { accent: 'bg-amber-500', key: 'higherCarb', surface: 'bg-amber-50' },
] as const;

function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'th' ? 'th-TH' : 'en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function getBMICategoryClassName(category: string): string {
  if (category === 'Normal weight') {
    return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
  }

  if (category === 'Underweight') {
    return 'bg-sky-100 text-sky-700 ring-sky-600/20';
  }

  return 'bg-amber-100 text-amber-800 ring-amber-600/20';
}

function getBMICategoryLabel(
  category: string,
  translations: TranslationDictionary,
): string {
  switch (category) {
    case 'Underweight':
      return translations.bmiCategory.underweight;
    case 'Normal weight':
      return translations.bmiCategory.normalWeight;
    case 'Overweight':
      return translations.bmiCategory.overweight;
    case 'Obesity':
      return translations.bmiCategory.obesity;
    default:
      return category;
  }
}

function getMacroCalories(split: MacronutrientSplit): number {
  return split.protein * 4 + split.fat * 9 + split.carbs * 4;
}

interface MetricExplanationProps {
  description: string;
  title: string;
}

function MetricExplanation({ description, title }: MetricExplanationProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
    </article>
  );
}

interface MacroStatProps {
  accentClassName: string;
  grams: number;
  label: string;
  percentage: number;
}

function MacroStat({
  accentClassName,
  grams,
  label,
  percentage,
}: MacroStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`size-3 shrink-0 rounded-full ${accentClassName}`} />
          <span className="truncate text-base font-bold text-slate-700">{label}</span>
        </div>
        <span className="shrink-0 text-2xl font-black tracking-tight text-slate-950">
          {Math.round(grams)} <span className="text-sm font-bold text-slate-500">g</span>
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${accentClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function ResultCard({ language, result }: ResultCardProps) {
  const [selectedGoal, setSelectedGoal] = useState<MacroGoal>('maintenance');
  const t = getTranslations(language);
  const selectedMacroPlan = result.macronutrients[selectedGoal];
  const macroGoals: ReadonlyArray<MacroGoal> = ['maintenance', 'cutting', 'bulking'];

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
      aria-live="polite"
      className="space-y-8"
    >
      <div className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
              {t.results.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {t.results.title}
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getBMICategoryClassName(
              result.bmiCategory,
            )}`}
          >
            {getBMICategoryLabel(result.bmiCategory, t)}
          </span>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-emerald-500 p-5 text-emerald-950">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-950/70">
              {t.results.tdee}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {formatNumber(result.tdee, language)}
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-950/75">
              {t.common.kcalPerDay}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.results.bmr}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {formatNumber(result.bmr, language)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">{t.common.kcalPerDay}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.results.bmi}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {formatNumber(result.bmi, language)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {getBMICategoryLabel(result.bmiCategory, t)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-base font-bold">{t.results.formulaTitle}</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs font-bold text-emerald-300">BMI</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.education.bmi}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs font-bold text-emerald-300">BMR</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.education.bmr}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs font-bold text-emerald-300">TDEE</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.education.tdee}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-8">
          <div>
            <p className="text-sm font-bold text-slate-900">{t.results.activityTableTitle}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t.results.activityTableDescription}
            </p>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 font-bold">{t.form.activityLevel}</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-right font-bold">{t.results.tdee}</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_ROWS.map((activity) => (
                  <tr className="border-b border-slate-100 last:border-0" key={activity}>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 font-medium text-slate-700">
                      {t.activity[activity]}
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 text-right font-bold text-slate-950">
                      {formatNumber(result.tdeeTable[activity], language)}{' '}
                      <span className="text-xs font-medium text-slate-400">
                        {t.common.kcalPerDay}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-8">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            {t.results.idealWeightTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t.results.idealWeightDescription}</p>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {t.education.idealWeight}
          </p>
          <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {IDEAL_WEIGHT_FORMULAS.map((formula) => (
              <MetricExplanation
                description={t.education[formula]}
                key={formula}
                title={formula.charAt(0).toUpperCase() + formula.slice(1)}
              />
            ))}
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 font-bold">{t.results.formula}</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-right font-bold">
                    {t.results.estimatedWeight}
                  </th>
                </tr>
              </thead>
              <tbody>
                {IDEAL_WEIGHT_FORMULAS.map((formula) => (
                  <tr className="border-t border-slate-100" key={formula}>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 font-semibold capitalize text-slate-700">{formula}</td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 text-right font-bold text-slate-950">
                      {formatNumber(result.idealWeight[formula], language)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 sm:p-8">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            {t.results.macrosTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t.results.macrosDescription}</p>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {t.education.macros}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1" role="tablist">
            {macroGoals.map((goal) => (
              <button
                aria-selected={selectedGoal === goal}
                className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
                  selectedGoal === goal
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                role="tab"
                type="button"
              >
                {goalLabel[goal]}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
            {goalDescription[selectedGoal]}
          </div>

          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-8">
            {MACRO_DIETS.map((diet) => {
              const split = selectedMacroPlan[diet.key];
              const totalCalories = getMacroCalories(split);
              const proteinPercentage = totalCalories
                ? (split.protein * 4 * 100) / totalCalories
                : 0;
              const fatPercentage = totalCalories ? (split.fat * 9 * 100) / totalCalories : 0;
              const carbPercentage = totalCalories ? (split.carbs * 4 * 100) / totalCalories : 0;

              return (
                <article
                  className={`overflow-hidden rounded-2xl border border-slate-200 ${diet.surface}`}
                  key={diet.key}
                >
                  <div className={`h-1.5 ${diet.accent}`} />
                  <div className="p-8 sm:p-10">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xl font-black tracking-tight text-slate-900">
                        {t.results[diet.key]}
                      </h4>
                      <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm">
                        {formatNumber(totalCalories, language)} kcal
                      </span>
                    </div>
                    <div className="mt-6 space-y-4">
                      <MacroStat
                        accentClassName="bg-rose-500"
                        grams={split.protein}
                        label={t.results.protein}
                        percentage={proteinPercentage}
                      />
                      <MacroStat
                        accentClassName="bg-amber-500"
                        grams={split.fat}
                        label={t.results.fat}
                        percentage={fatPercentage}
                      />
                      <MacroStat
                        accentClassName="bg-sky-500"
                        grams={split.carbs}
                        label={t.results.carbs}
                        percentage={carbPercentage}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <p className="px-2 text-center text-xs leading-5 text-slate-500">
        {t.results.disclaimer}
      </p>
    </section>
  );
}
