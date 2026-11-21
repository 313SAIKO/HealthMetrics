// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

// These boundary tests must never initialize auth or open the application DB.
vi.mock("../src/server/auth", () => ({
  getServerContext: vi.fn(() => {
    throw new Error(
      "HTTP boundary tests must not initialize a server database.",
    );
  }),
}));

import { ApiError } from "../src/server/errors";
import {
  handleApi,
  jsonResponse,
  MAX_BODY_BYTES,
  readJsonBody,
  requireTrustedOrigin,
  requireWriteCapacity,
} from "../src/server/http";

const baseURL = "http://127.0.0.1:3101";

function request(body: string, headers: Record<string, string> = {}) {
  return new Request(`${baseURL}/api/assessments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("JSON request boundaries", () => {
  it("reads JSON with a charset and Unicode split between streamed chunks", async () => {
    const value = { title: "น้ำหนัก", measuredAt: "2026-11-21" };
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 2)
          controller.enqueue(bytes.slice(offset, offset + 2));
        controller.close();
      },
    });
    const streamed = new Request(`${baseURL}/api/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      ...{ duplex: "half" },
    });
    expect(await readJsonBody(streamed)).toEqual(value);
  });

  it.each([
    ["{broken", {}],
    ["{}", { "Content-Type": "text/plain" }],
    ["{}", { "Content-Length": "not-a-length" }],
    ["{}", { "Content-Length": String(MAX_BODY_BYTES + 1) }],
  ])(
    "rejects invalid JSON or request metadata %s %j",
    async (body, headers) => {
      await expect(
        readJsonBody(request(body, headers as Record<string, string>)),
      ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    },
  );

  it("enforces the byte limit while streaming without a Content-Length", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        cancelled = true;
      },
    });
    const streamed = new Request(`${baseURL}/api/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      ...{ duplex: "half" },
    });
    expect(streamed.headers.has("content-length")).toBe(false);
    await expect(readJsonBody(streamed)).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(cancelled).toBe(true);
  });

  it("rejects invalid UTF-8 rather than replacing bytes inside submitted data", async () => {
    const invalid = new Request(`${baseURL}/api/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: new Uint8Array([123, 34, 116, 34, 58, 34, 255, 34, 125]),
    });
    await expect(readJsonBody(invalid)).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("permits an empty body only when the caller explicitly allows it", async () => {
    const empty = () =>
      new Request(`${baseURL}/api/auth/sign-out`, { method: "POST" });
    await expect(readJsonBody(empty())).rejects.toMatchObject({ status: 400 });
    expect(await readJsonBody(empty(), true)).toEqual({});
  });
});

describe("private API responses and access boundaries", () => {
  it("marks JSON responses as private and not cacheable", () => {
    const response = jsonResponse({ private: true });
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("allows only the configured origin and rejects cross-site metadata", () => {
    vi.stubEnv("BETTER_AUTH_URL", baseURL);
    vi.stubEnv("BETTER_AUTH_SECRET", "boundary-test-secret-".repeat(3));
    expect(() =>
      requireTrustedOrigin(request("{}", { Origin: baseURL })),
    ).not.toThrow();
    const rejectedHeaders: Record<string, string>[] = [
      {},
      { Origin: "https://untrusted.example.invalid" },
      { Origin: baseURL, "Sec-Fetch-Site": "cross-site" },
    ];
    for (const headers of rejectedHeaders) {
      expect(() => requireTrustedOrigin(request("{}", headers))).toThrowError(
        expect.objectContaining({ status: 403, code: "FORBIDDEN" }),
      );
    }
  });

  it("serializes validation fields and a retry delay without losing privacy headers", async () => {
    const response = await handleApi(async () => {
      throw new ApiError(429, "RATE_LIMITED", "Try later.");
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const validation = await handleApi(async () => {
      throw new ApiError(400, "VALIDATION_ERROR", "Check values.", {
        measuredAt: "date",
      });
    });
    expect(await validation.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", fields: { measuredAt: "date" } },
    });
  });

  it("does not expose unexpected error details in responses or logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const sensitive = "SQL statement with private-profile and credential-value";
    const response = await handleApi(async () => {
      throw new Error(sensitive);
    });
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("INTERNAL_ERROR");
    expect(text).not.toContain(sensitive);
    expect(log).toHaveBeenCalledExactlyOnceWith(
      "HealthMetrics server request failed.",
    );
  });

  it("limits writes per account and permits writes again after the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T01:00:00Z"));
    const user = randomUUID();
    for (let count = 0; count < 60; count++) requireWriteCapacity(user);
    expect(() => requireWriteCapacity(user)).toThrowError(
      expect.objectContaining({ status: 429, code: "RATE_LIMITED" }),
    );
    expect(() => requireWriteCapacity(randomUUID())).not.toThrow();
    vi.setSystemTime(new Date("2026-11-21T01:01:00Z"));
    expect(() => requireWriteCapacity(user)).not.toThrow();
  });
});
