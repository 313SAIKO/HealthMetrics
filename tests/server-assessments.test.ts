// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAssessment,
  deleteAssessment,
  getAssessment,
  isCalendarDate,
  listAssessments,
  parseAssessmentQuery,
  updateAssessment,
  validateAssessmentInput,
} from "../src/server/assessments";
import {
  createDatabase,
  migrateAssessmentDatabase,
} from "../src/server/database";
import type { AssessmentInput } from "../src/types/assessment";

function input(title = "Baseline", measuredAt = "2026-11-19"): AssessmentInput {
  return {
    title,
    measuredAt,
    profile: {
      gender: "M",
      age: 30,
      weight: 70,
      height: 175,
      activityMultiplier: 1.2,
    },
  };
}

const defaultQuery = { page: 1, pageSize: 20 };

describe("assessment network input", () => {
  it.each([
    ["2024-02-29", true],
    ["2000-02-29", true],
    ["2025-02-29", false],
    ["1900-02-29", false],
    ["2026-04-31", false],
    ["2026-13-01", false],
    ["2026-11-19T00:00:00Z", false],
    ["2026-1-1", false],
    [null, false],
  ])("recognizes calendar date %j", (value, expected) => {
    expect(isCalendarDate(value)).toBe(expected);
  });

  it("trims titles and copies the verified profile", () => {
    const body = input("  Morning measurement  ");
    const checked = validateAssessmentInput(body);
    expect(checked.title).toBe("Morning measurement");
    expect(checked.profile).toEqual(body.profile);
    body.profile.weight = 99;
    expect(checked.profile.weight).toBe(70);
  });

  it.each([
    null,
    [],
    {},
    { ...input(), title: " " },
    { ...input(), title: "x".repeat(121) },
    { ...input(), ownerId: "another-user" },
    { ...input(), result: { tdee: 1 } },
    { ...input(), formulaVersion: "client-version" },
    { ...input(), measuredAt: "2025-02-29" },
    { ...input(), profile: { ...input().profile, weight: "70" } },
    { ...input(), profile: { ...input().profile, age: 19 } },
    { ...input(), profile: { ...input().profile, age: 30.5 } },
    { ...input(), profile: { ...input().profile, weight: Infinity } },
    { ...input(), profile: { ...input().profile, height: 221 } },
    { ...input(), profile: { ...input().profile, activityMultiplier: 1.3 } },
    { ...input(), profile: { ...input().profile, gender: "X" } },
    { ...input(), profile: { ...input().profile, userId: "another-user" } },
  ])("rejects untrusted body %j with a validation error", (value) => {
    expect(() => validateAssessmentInput(value)).toThrowError(
      expect.objectContaining({ status: 400, code: "VALIDATION_ERROR" }),
    );
  });

  it("parses explicit date filters and applies bounded defaults", () => {
    expect(parseAssessmentQuery(new URLSearchParams())).toEqual(defaultQuery);
    expect(
      parseAssessmentQuery(
        new URLSearchParams(
          "from=2024-02-29&to=2024-03-01&page=2&pageSize=100",
        ),
      ),
    ).toEqual({
      from: "2024-02-29",
      to: "2024-03-01",
      page: 2,
      pageSize: 100,
    });
  });

  it.each([
    "page=0",
    "page=-1",
    "page=1.5",
    "page=1e2",
    "page=1000001",
    "pageSize=0",
    "pageSize=101",
    "page=1&page=2",
    "ownerId=another-user",
    "from=2025-02-29",
    "from=2026-11-20&to=2026-11-19",
    "from=%27%20OR%201%3D1--",
  ])("rejects unsupported query %s", (query) => {
    expect(() => parseAssessmentQuery(new URLSearchParams(query))).toThrowError(
      expect.objectContaining({ status: 400, code: "VALIDATION_ERROR" }),
    );
  });
});

describe("assessment persistence", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T01:00:00.000Z"));
    database = createDatabase(":memory:");
    // Auth integration is covered over HTTP; repository tests need only its FK.
    database.exec("CREATE TABLE user (id TEXT PRIMARY KEY)");
    database.prepare("INSERT INTO user (id) VALUES (?)").run("owner");
    database.prepare("INSERT INTO user (id) VALUES (?)").run("other");
    migrateAssessmentDatabase(database);
  });

  afterEach(() => {
    database?.close();
    vi.useRealTimers();
  });

  it("stores a computed snapshot and recomputes it when its profile changes", () => {
    const saved = createAssessment(database, "owner", input());
    expect(saved.result.bmr).toBe(1648.75);
    expect(saved.result.tdee).toBe(1978.5);
    expect(saved.formulaVersion.length).toBeGreaterThan(0);
    expect(getAssessment(database, "owner", saved.id)).toEqual(saved);
    vi.setSystemTime(new Date("2026-11-22T01:00:00.000Z"));
    const change = input("Updated", "2026-11-20");
    change.profile.weight = 71;
    const updated = updateAssessment(database, "owner", saved.id, change);
    expect(updated.id).toBe(saved.id);
    expect(updated.createdAt).toBe(saved.createdAt);
    expect(updated.updatedAt).toBe("2026-11-22T01:00:00.000Z");
    expect(updated.title).toBe("Updated");
    expect(updated.measuredAt).toBe("2026-11-20");
    expect(updated.result.bmr).toBe(1658.75);
    expect(updated.result.tdee).toBe(1990.5);
    expect(getAssessment(database, "owner", saved.id)).toEqual(updated);
  });

  it("retains profile and result snapshots after closing and reopening its file", () => {
    const directory = mkdtempSync(join(tmpdir(), "healthmetrics-test-"));
    const path = join(directory, "assessments.sqlite");
    let fileDatabase: DatabaseSync | undefined;
    try {
      fileDatabase = createDatabase(path);
      fileDatabase.exec("CREATE TABLE user (id TEXT PRIMARY KEY)");
      fileDatabase.prepare("INSERT INTO user (id) VALUES (?)").run("owner");
      migrateAssessmentDatabase(fileDatabase);
      const saved = createAssessment(fileDatabase, "owner", input());
      fileDatabase.close();
      fileDatabase = undefined;

      fileDatabase = createDatabase(path);
      migrateAssessmentDatabase(fileDatabase);
      expect(getAssessment(fileDatabase, "owner", saved.id)).toEqual(saved);
      expect(
        listAssessments(fileDatabase, "owner", defaultQuery),
      ).toMatchObject({
        total: 1,
        items: [saved],
      });
    } finally {
      fileDatabase?.close();
      for (const file of [path, `${path}-wal`, `${path}-shm`])
        rmSync(file, { force: true });
      rmdirSync(directory);
    }
  });

  it("returns not found for every other user's single-record operation", () => {
    const saved = createAssessment(database, "owner", input());
    for (const operation of [
      () => getAssessment(database, "other", saved.id),
      () => updateAssessment(database, "other", saved.id, input("Hijacked")),
      () => deleteAssessment(database, "other", saved.id),
    ]) {
      expect(operation).toThrowError(
        expect.objectContaining({ status: 404, code: "NOT_FOUND" }),
      );
    }
    expect(listAssessments(database, "other", defaultQuery)).toMatchObject({
      total: 0,
      items: [],
    });
    expect(getAssessment(database, "owner", saved.id)).toEqual(saved);
  });

  it("counts only the owner and requested dates before paginating", () => {
    createAssessment(database, "owner", input("Before", "2026-11-18"));
    const first = createAssessment(
      database,
      "owner",
      input("First included", "2026-11-19"),
    );
    const last = createAssessment(
      database,
      "owner",
      input("Last included", "2026-11-20"),
    );
    createAssessment(database, "owner", input("After", "2026-11-21"));
    createAssessment(database, "other", input("Other user", "2026-11-20"));
    const query = {
      from: "2026-11-19",
      to: "2026-11-20",
      page: 1,
      pageSize: 1,
    };
    const pageOne = listAssessments(database, "owner", query);
    const pageTwo = listAssessments(database, "owner", { ...query, page: 2 });
    expect(pageOne).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(pageOne.items.map((item) => item.id)).toEqual([last.id]);
    expect(pageTwo).toMatchObject({ total: 2, page: 2, pageSize: 1 });
    expect(pageTwo.items.map((item) => item.id)).toEqual([first.id]);
    expect(
      listAssessments(database, "owner", { ...query, page: 3 }).items,
    ).toEqual([]);
    expect(() =>
      listAssessments(database, "owner", { ...query, page: 0 }),
    ).toThrowError(expect.objectContaining({ status: 400 }));
  });

  it("treats SQL-looking titles as data and preserves records across migrations", () => {
    const title = "'); DROP TABLE assessments; --";
    const saved = createAssessment(database, "owner", input(title));
    migrateAssessmentDatabase(database);
    expect(getAssessment(database, "owner", saved.id).title).toBe(title);
    expect(listAssessments(database, "owner", defaultQuery).total).toBe(1);
    createAssessment(database, "owner", input("Still available"));
    expect(listAssessments(database, "owner", defaultQuery).total).toBe(2);
  });

  it("deletes only the requested record and cascades when its owner is removed", () => {
    const deleted = createAssessment(database, "owner", input("Delete me"));
    const retained = createAssessment(database, "owner", input("Retain me"));
    const other = createAssessment(database, "other", input("Other user"));
    deleteAssessment(database, "owner", deleted.id);
    expect(() => getAssessment(database, "owner", deleted.id)).toThrowError(
      expect.objectContaining({ status: 404 }),
    );
    expect(listAssessments(database, "owner", defaultQuery).items).toEqual([
      retained,
    ]);
    database.prepare("DELETE FROM user WHERE id = ?").run("owner");
    expect(listAssessments(database, "owner", defaultQuery).total).toBe(0);
    expect(getAssessment(database, "other", other.id)).toEqual(other);
  });
});
