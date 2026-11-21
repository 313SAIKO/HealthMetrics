import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

export interface ServerConfig {
  databasePath: string;
  baseURL: string;
  secret: string;
  secureCookies: boolean;
}

const developmentState = globalThis as typeof globalThis & {
  healthMetricsDevelopmentSecret?: string;
};

/** Read only when the server is first used, so builds require no runtime secrets. */
export function getServerConfig(): ServerConfig {
  const production = process.env.NODE_ENV === "production";
  const configuredURL = process.env.BETTER_AUTH_URL;
  if (production && !configuredURL) {
    throw new Error("BETTER_AUTH_URL is required in production.");
  }
  const url = new URL(configuredURL || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("BETTER_AUTH_URL must be an HTTP(S) origin.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (production && url.protocol !== "https:" && !loopback) {
    throw new Error("Production BETTER_AUTH_URL must use HTTPS.");
  }
  let secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && !production) {
    developmentState.healthMetricsDevelopmentSecret ??=
      randomBytes(48).toString("base64url");
    secret = developmentState.healthMetricsDevelopmentSecret;
  }
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }
  const configuredPath =
    process.env.DATABASE_PATH || "data/healthmetrics.sqlite";
  return {
    databasePath:
      configuredPath === ":memory:"
        ? configuredPath
        : resolve(/* turbopackIgnore: true */ configuredPath),
    baseURL: url.origin,
    secret,
    secureCookies: url.protocol === "https:",
  };
}
