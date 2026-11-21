import { getServerContext } from "./auth";
import { getServerConfig } from "./config";
import { ApiError, invalidInput } from "./errors";

export const MAX_BODY_BYTES = 16_384;

export function privateResponse(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function jsonResponse(value: unknown, status = 200): Response {
  return privateResponse(Response.json(value, { status }));
}

export async function handleApi(
  operation: () => Promise<Response>,
): Promise<Response> {
  try {
    return privateResponse(await operation());
  } catch (error) {
    if (error instanceof ApiError) {
      const response = jsonResponse(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
          },
        },
        error.status,
      );
      if (error.status === 429) response.headers.set("Retry-After", "60");
      return response;
    }
    // Do not log submitted health profiles, SQL statements, sessions, or credentials.
    console.error("HealthMetrics server request failed.");
    return jsonResponse(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "The request could not be completed.",
        },
      },
      500,
    );
  }
}

export function requireTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== getServerConfig().baseURL ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(403, "FORBIDDEN", "Request origin is not allowed.");
  }
}

/** Count bytes while streaming, so missing or untrusted Content-Length cannot bypass the cap. */
export async function readJsonBody(
  request: Request,
  allowEmpty = false,
): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)
  )
    invalidInput({ body: "The request body is too large." });
  if (!request.body) {
    if (allowEmpty) return {};
    invalidInput({ body: "A JSON request body is required." });
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        invalidInput({ body: "The request body is too large." });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (allowEmpty && total === 0) return {};
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    invalidInput({ body: "Use application/json." });
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as unknown;
  } catch {
    invalidInput({ body: "The request body must be valid JSON." });
  }
}

export async function requireUser(request: Request) {
  const context = await getServerContext();
  const session = await context.auth.api.getSession({
    headers: request.headers,
  });
  if (!session)
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Sign in to access saved assessments.",
    );
  return { ...context, user: session.user };
}

const writeWindows = new Map<string, { count: number; expiresAt: number }>();

/** A per-process account write limit; auth has its own persistent Better Auth rate limiter. */
export function requireWriteCapacity(userId: string): void {
  const now = Date.now();
  if (writeWindows.size >= 10_000) {
    for (const [key, value] of writeWindows)
      if (value.expiresAt <= now) writeWindows.delete(key);
  }
  let window = writeWindows.get(userId);
  if (!window || window.expiresAt <= now) {
    if (writeWindows.size >= 10_000 && !window)
      throw new ApiError(429, "RATE_LIMITED", "Please try again later.");
    window = { count: 0, expiresAt: now + 60_000 };
    writeWindows.set(userId, window);
  }
  window.count += 1;
  if (window.count > 60)
    throw new ApiError(429, "RATE_LIMITED", "Please try again later.");
}
