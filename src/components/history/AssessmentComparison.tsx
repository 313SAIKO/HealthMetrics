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
  const signed = new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  });
  const activity = (item: Assessment) => {
    const key = (
      Object.keys(ACTIVITY_MULTIPLIERS) as (keyof typeof ACTIVITY_MULTIPLIERS)[]
    ).find(
      (key) => ACTIVITY_MULTIPLIERS[key] === item.profile.activityMultiplier,
    );
    return key
      ? health.activity[key]
      : number.format(item.profile.activityMultiplier);
  };
  const numericRows = [
    {
      key: "weight",
      label: t.weight,
      values: [first.profile.weight, second.profile.weight],
    },
    {
      key: "height",
      label: t.height,
      values: [first.profile.height, second.profile.height],
    },
    {
      key: "age",
      label: t.age,
      values: [first.profile.age, second.profile.age],
    },
    { key: "bmi", label: t.bmi, values: [first.result.bmi, second.result.bmi] },
    { key: "bmr", label: t.bmr, values: [first.result.bmr, second.result.bmr] },
    {
      key: "tdee",
      label: t.tdee,
      values: [first.result.tdee, second.result.tdee],
    },
  ];
  const rows = [
    {
      key: "measuredAt",
      label: t.measuredAt,
      first: formatMeasurementDate(first.measuredAt, language),
      second: formatMeasurementDate(second.measuredAt, language),
      difference: t.noDifference,
    },
    ...numericRows.map((row) => ({
      key: row.key,
      label: row.label,
      first: number.format(row.values[0]),
      second: number.format(row.values[1]),
      difference: signed.format(row.values[1] - row.values[0]),
    })),
    {
      key: "activity",
      label: t.activity,
      first: activity(first),
      second: activity(second),
      difference: t.noDifference,
    },
    {
      key: "gender",
      label: t.gender,
      first:
        first.profile.gender === "M" ? health.form.male : health.form.female,
      second:
        second.profile.gender === "M" ? health.form.male : health.form.female,
      difference: t.noDifference,
    },
  ];
  return (
    <section
      data-testid="assessment-comparison"
      aria-labelledby="comparison-heading"
      className="hm-surface min-w-0 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="comparison-heading" className="hm-section-heading">
          {t.comparison}
        </h2>
        <button onClick={onClear} type="button" className="hm-button-secondary">
          {t.clearComparison}
        </button>
      </div>
      <p className="mt-2 max-w-prose text-sm leading-6 text-slate-600">
        {language === "th"
          ? "เปรียบเทียบค่าที่บันทึกไว้ ผลต่างคือรายการที่สองลบรายการแรก ไม่ใช่การคาดการณ์หรือคำแนะนำทางการแพทย์"
          : "Compare saved measurements. Differences are the second record minus the first, not predictions or medical advice."}
      </p>
      <ol className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-200 py-4">
        {records.map((record, index) => (
          <li
            key={record.id}
            data-testid={
              index === 0
                ? "comparison-record-first"
                : "comparison-record-second"
            }
            className="min-w-0"
          >
            <p className="break-words text-sm font-semibold leading-6 text-slate-900">
              <span className="mr-1 text-emerald-800">{index + 1}.</span>
              {record.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {formatMeasurementDate(record.measuredAt, language)}
            </p>
          </li>
        ))}
      </ol>
      <dl
        data-testid="comparison-mobile"
        className="divide-y divide-slate-200 sm:hidden"
      >
        {rows.map((row) => (
          <div
            key={row.key}
            data-testid="comparison-metric"
            data-metric={row.key}
            className="py-4"
          >
            <dt className="text-sm font-semibold leading-6 text-slate-700">
              {row.label}
            </dt>
            <dd className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="min-w-0">
                <span className="mr-2 text-sm text-slate-500">1.</span>
                <span
                  data-testid="comparison-first-value"
                  className="break-words text-base font-semibold tabular-nums text-slate-950"
                >
                  {row.first}
                </span>
              </div>
              <div className="min-w-0">
                <span className="mr-2 text-sm text-slate-500">2.</span>
                <span
                  data-testid="comparison-second-value"
                  className="break-words text-base font-semibold tabular-nums text-slate-950"
                >
                  {row.second}
                </span>
              </div>
              <p className="col-span-2 text-sm leading-6 text-slate-600">
                {t.difference}:{" "}
                <strong
                  data-testid="comparison-difference"
                  className="font-semibold tabular-nums text-slate-900"
                >
                  {row.difference}
                </strong>
              </p>
            </dd>
          </div>
        ))}
      </dl>
      <table
        data-testid="comparison-desktop"
        className="mt-2 hidden w-full table-fixed text-left text-sm sm:table"
      >
        <caption className="sr-only">
          {t.comparison}. {t.difference}.
        </caption>
        <thead className="border-b border-slate-200 text-slate-600">
          <tr>
            <th scope="col" className="w-[28%] py-4 pr-4 font-medium">
              {t.metric}
            </th>
            <th scope="col" className="w-[24%] break-words p-3 font-medium">
              1. {first.title}
            </th>
            <th scope="col" className="w-[24%] break-words p-3 font-medium">
              2. {second.title}
            </th>
            <th scope="col" className="w-[24%] py-4 pl-3 font-medium">
              {t.difference}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key}>
              <th
                scope="row"
                className="py-4 pr-4 font-medium leading-6 text-slate-700"
              >
                {row.label}
              </th>
              <td className="break-words p-3 leading-6 tabular-nums text-slate-950">
                {row.first}
              </td>
              <td className="break-words p-3 leading-6 tabular-nums text-slate-950">
                {row.second}
              </td>
              <td className="break-words py-4 pl-3 font-semibold tabular-nums text-slate-950">
                {row.difference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
