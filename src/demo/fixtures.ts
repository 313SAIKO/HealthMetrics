import { calculateHealthResult } from "../core/assessment";
import type { Language, UserProfile } from "../types";
import type { Assessment } from "../types/assessment";

/** Fictional examples only. Each call returns independent, mutable UI snapshots. */
export function createDemoAssessments(language: Language = "th"): Assessment[] {
  const samples = [
    {
      id: "demo-follow-up",
      date: "2026-11-20",
      weight: 71,
      en: "November follow-up",
      th: "ตัวอย่างติดตามผลเดือนพฤศจิกายน",
    },
    {
      id: "demo-baseline",
      date: "2026-11-13",
      weight: 70,
      en: "November baseline",
      th: "ตัวอย่างเริ่มต้นเดือนพฤศจิกายน",
    },
    {
      id: "demo-october-late",
      date: "2026-10-28",
      weight: 70.5,
      en: "Late October check-in",
      th: "ตัวอย่างปลายเดือนตุลาคม",
    },
    {
      id: "demo-october-middle",
      date: "2026-10-15",
      weight: 69.8,
      en: "Mid October check-in",
      th: "ตัวอย่างกลางเดือนตุลาคม",
    },
    {
      id: "demo-october-start",
      date: "2026-10-03",
      weight: 70.2,
      en: "Early October check-in",
      th: "ตัวอย่างต้นเดือนตุลาคม",
    },
  ];
  return samples.map((sample) => {
    const profile: UserProfile = {
      gender: "M",
      age: 30,
      weight: sample.weight,
      height: 175,
      activityMultiplier: 1.2,
    };
    return {
      id: sample.id,
      title: language === "th" ? sample.th : sample.en,
      measuredAt: sample.date,
      createdAt: sample.date + "T08:00:00.000Z",
      updatedAt: sample.date + "T08:00:00.000Z",
      profile,
      result: calculateHealthResult(profile),
      formulaVersion: "demo-v1",
    };
  });
}
