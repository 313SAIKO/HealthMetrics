import type { Language } from "../../types";
import { getWorkspaceTranslations } from "../../utils/workspace-translations";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export async function apiRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      data?.error?.code ?? data?.code ?? "REQUEST_FAILED",
    );
  return data as T;
}

export function apiErrorText(error: unknown, language: Language): string {
  const t = getWorkspaceTranslations(language);
  if (!(error instanceof ApiError)) return t.networkError;
  if (error.code.includes("ALREADY_EXISTS")) return t.emailExists;
  if (
    error.code === "INVALID_EMAIL_OR_PASSWORD" ||
    error.code === "INVALID_PASSWORD"
  )
    return t.invalidCredentials;
  if (error.status === 401) return t.expired;
  if (error.status === 403) return t.forbidden;
  if (error.status === 404) return t.notFound;
  if (error.status === 429) return t.rateLimited;
  if (error.status === 400 || error.status === 422) return t.invalidRequest;
  return t.networkError;
}
