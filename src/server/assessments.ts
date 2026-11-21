import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { calculateHealthResult } from "../core/assessment";
import { validateProfile } from "../core/validation";
import type { FormProfile, HealthResult, UserProfile } from "../types";
import type {
  Assessment,
  AssessmentInput,
  AssessmentList,
} from "../types/assessment";
import { ApiError, invalidInput } from "./errors";

export const FORMULA_VERSION = "2026-11-21.1";
export const MAX_PAGE_SIZE = 100;

export interface AssessmentQuery {
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Treat network bodies as unknown and copy only verified profile fields. */
export function validateAssessmentInput(value: unknown): AssessmentInput {
  if (!isRecord(value) || !exactKeys(value, ["title", "measuredAt", "profile"]))
    invalidInput();
  const fields: Record<string, string> = {};
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (!title || title.length > 120)
    fields.title = "Enter a title from 1 to 120 characters.";
  if (!isCalendarDate(value.measuredAt))
    fields.measuredAt = "Enter a valid YYYY-MM-DD date.";
  const profile = value.profile;
  if (
    !isRecord(profile) ||
    !exactKeys(profile, [
      "gender",
      "age",
      "weight",
      "height",
      "activityMultiplier",
    ])
  ) {
    fields.profile = "Submit only the supported profile fields.";
  } else {
    for (const [field, code] of Object.entries(
      validateProfile(profile as unknown as FormProfile),
    )) {
      fields[`profile.${field}`] = code;
    }
  }
  if (Object.keys(fields).length || !isRecord(profile)) invalidInput(fields);
  const checkedProfile: UserProfile = {
    gender: profile.gender as UserProfile["gender"],
    age: profile.age as number,
    weight: profile.weight as number,
    height: profile.height as number,
    activityMultiplier: profile.activityMultiplier as number,
  };
  // Some individually supported ranges combine into an unsupported resting-energy estimate.
  calculateAssessmentResult(checkedProfile);
  return {
    title,
    measuredAt: value.measuredAt as string,
    profile: checkedProfile,
  };
}

export function calculateAssessmentResult(profile: UserProfile): HealthResult {
  try {
    return calculateHealthResult(profile);
  } catch (error) {
    if (error instanceof RangeError)
      invalidInput({
        profile: "This profile cannot produce a supported estimate.",
      });
    throw error;
  }
}

export function parseAssessmentQuery(
  parameters: URLSearchParams,
): AssessmentQuery {
  const allowed = ["from", "to", "page", "pageSize"];
  for (const key of parameters.keys()) {
    if (!allowed.includes(key) || parameters.getAll(key).length !== 1)
      invalidInput({ query: "Unsupported query parameters." });
  }
  const query: AssessmentQuery = { page: 1, pageSize: 20 };
  for (const key of ["from", "to"] as const) {
    const value = parameters.get(key);
    if (value !== null) {
      if (!isCalendarDate(value))
        invalidInput({ [key]: "Enter a valid YYYY-MM-DD date." });
      query[key] = value;
    }
  }
  if (query.from && query.to && query.from > query.to)
    invalidInput({ from: "The start date must not follow the end date." });
  for (const key of ["page", "pageSize"] as const) {
    const value = parameters.get(key);
    if (value === null) continue;
    const parsed = Number(value);
    const maximum = key === "pageSize" ? MAX_PAGE_SIZE : 1_000_000;
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(parsed) ||
      parsed < 1 ||
      parsed > maximum
    )
      invalidInput({ [key]: `Enter an integer from 1 to ${maximum}.` });
    query[key] = parsed;
  }
  return query;
}

interface AssessmentRow {
  id: string;
  title: string;
  measured_at: string;
  profile_json: string;
  result_json: string;
  formula_version: string;
  created_at: string;
  updated_at: string;
}

function mapAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    title: row.title,
    measuredAt: row.measured_at,
    profile: JSON.parse(row.profile_json) as UserProfile,
    result: JSON.parse(row.result_json) as HealthResult,
    formulaVersion: row.formula_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function notFound(): never {
  throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
}

export function getAssessment(
  database: DatabaseSync,
  userId: string,
  id: string,
): Assessment {
  const row = database
    .prepare("SELECT * FROM assessments WHERE id = ? AND user_id = ?")
    .get(id, userId) as unknown as AssessmentRow | undefined;
  if (!row) notFound();
  return mapAssessment(row);
}

export function listAssessments(
  database: DatabaseSync,
  userId: string,
  query: AssessmentQuery,
): AssessmentList {
  // Revalidate public repository arguments as well as HTTP query parameters.
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.from !== undefined) parameters.set("from", query.from);
  if (query.to !== undefined) parameters.set("to", query.to);
  const checked = parseAssessmentQuery(parameters);
  const conditions = ["user_id = ?"];
  const bindings: (string | number)[] = [userId];
  if (checked.from) {
    conditions.push("measured_at >= ?");
    bindings.push(checked.from);
  }
  if (checked.to) {
    conditions.push("measured_at <= ?");
    bindings.push(checked.to);
  }
  const where = conditions.join(" AND ");
  const count = database
    .prepare(`SELECT COUNT(*) AS total FROM assessments WHERE ${where}`)
    .get(...bindings);
  const rows = database
    .prepare(
      `SELECT * FROM assessments WHERE ${where} ORDER BY measured_at DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(
      ...bindings,
      checked.pageSize,
      (checked.page - 1) * checked.pageSize,
    ) as unknown as AssessmentRow[];
  return {
    items: rows.map(mapAssessment),
    total: Number(count?.total ?? 0),
    page: checked.page,
    pageSize: checked.pageSize,
  };
}

export function createAssessment(
  database: DatabaseSync,
  userId: string,
  value: unknown,
): Assessment {
  const input = validateAssessmentInput(value);
  const id = randomUUID();
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO assessments
    (id, user_id, title, measured_at, profile_json, result_json, formula_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      userId,
      input.title,
      input.measuredAt,
      JSON.stringify(input.profile),
      JSON.stringify(calculateAssessmentResult(input.profile)),
      FORMULA_VERSION,
      now,
      now,
    );
  return getAssessment(database, userId, id);
}

export function updateAssessment(
  database: DatabaseSync,
  userId: string,
  id: string,
  value: unknown,
): Assessment {
  const input = validateAssessmentInput(value);
  const updated = database
    .prepare(
      `UPDATE assessments SET title = ?, measured_at = ?, profile_json = ?, result_json = ?, formula_version = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    )
    .run(
      input.title,
      input.measuredAt,
      JSON.stringify(input.profile),
      JSON.stringify(calculateAssessmentResult(input.profile)),
      FORMULA_VERSION,
      new Date().toISOString(),
      id,
      userId,
    );
  if (Number(updated.changes) === 0) notFound();
  return getAssessment(database, userId, id);
}

export function deleteAssessment(
  database: DatabaseSync,
  userId: string,
  id: string,
): void {
  const deleted = database
    .prepare("DELETE FROM assessments WHERE id = ? AND user_id = ?")
    .run(id, userId);
  if (Number(deleted.changes) === 0) notFound();
}
