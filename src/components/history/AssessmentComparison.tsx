import type { Language } from "../../types";
import type { Assessment } from "../../types/assessment";
import { ACTIVITY_MULTIPLIERS } from "../../core/calculator";
import { getTranslations } from "../../utils/translations";
import {
  formatMeasurementDate,
  getWorkspaceTranslations,
} from "../../utils/workspace-translations";

export function AssessmentComparison({
  records,
  language,
  onClear,
}: {
  records: [Assessment, Assessment];
  language: Language;
  onClear: () => void;
}) {
  const t = getWorkspaceTranslations(language);
  const health = getTranslations(language);
  const [first, second] = records;
  const number = new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 2,
  });
  const delta = new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  });
  const rows: { label: string; values: [number, number] }[] = [
    { label: t.weight, values: [first.profile.weight, second.profile.weight] },
    { label: t.height, values: [first.profile.height, second.profile.height] },
    { label: t.age, values: [first.profile.age, second.profile.age] },
    { label: t.bmi, values: [first.result.bmi, second.result.bmi] },
    { label: t.bmr, values: [first.result.bmr, second.result.bmr] },
    { label: t.tdee, values: [first.result.tdee, second.result.tdee] },
  ];
  const activity = (item: Assessment) => {
    const key = (
      Object.keys(ACTIVITY_MULTIPLIERS) as (keyof typeof ACTIVITY_MULTIPLIERS)[]
    ).find(
      (key) => ACTIVITY_MULTIPLIERS[key] === item.profile.activityMultiplier,
    );
    return key ? health.activity[key] : String(item.profile.activityMultiplier);
  };
  return (
    <section
      data-testid="assessment-comparison"
      aria-labelledby="comparison-heading"
      className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="comparison-heading"
          className="text-xl font-bold text-slate-950"
        >
          {t.comparison}
        </h2>
        <button
          onClick={onClear}
          type="button"
          className="rounded-lg border border-emerald-700 bg-white px-3 py-2 text-sm font-bold text-emerald-800"
        >
          {t.clearComparison}
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t.historyHelp}</p>
      <p className="mt-3 text-xs leading-5 text-slate-600">
        {t.comparisonScroll}
      </p>
      <div
        tabIndex={0}
        role="region"
        aria-label={t.comparison}
        className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
      >
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">
            {t.comparison}. {t.difference}.
          </caption>
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th scope="col" className="p-3">
                {t.metric}
              </th>
              <th scope="col" className="max-w-48 break-words p-3">
                1. {first.title}
              </th>
              <th scope="col" className="max-w-48 break-words p-3">
                2. {second.title}
              </th>
              <th scope="col" className="p-3">
                {t.difference}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <th scope="row" className="p-3 font-medium">
                {t.measuredAt}
              </th>
              <td className="p-3">
                {formatMeasurementDate(first.measuredAt, language)}
              </td>
              <td className="p-3">
                {formatMeasurementDate(second.measuredAt, language)}
              </td>
              <td className="p-3">{t.noDifference}</td>
            </tr>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="p-3 font-medium">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={index} className="p-3 tabular-nums">
                    {number.format(value)}
                  </td>
                ))}
                <td className="p-3 font-bold tabular-nums text-slate-900">
                  {delta.format(row.values[1] - row.values[0])}
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="p-3 font-medium">
                {t.activity}
              </th>
              <td className="p-3">{activity(first)}</td>
              <td className="p-3">{activity(second)}</td>
              <td className="p-3">{t.noDifference}</td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-medium">
                {t.gender}
              </th>
              <td className="p-3">
                {first.profile.gender === "M"
                  ? health.form.male
                  : health.form.female}
              </td>
              <td className="p-3">
                {second.profile.gender === "M"
                  ? health.form.male
                  : health.form.female}
              </td>
              <td className="p-3">{t.noDifference}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
