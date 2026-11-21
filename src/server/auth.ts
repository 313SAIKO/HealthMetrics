import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { getServerConfig } from "./config";
import { createDatabase, migrateAssessmentDatabase } from "./database";

async function initializeServer() {
  const config = getServerConfig();
  const database = createDatabase(config.databasePath);
  try {
    const auth = betterAuth({
      appName: "HealthMetrics",
      database,
      baseURL: config.baseURL,
      secret: config.secret,
      trustedOrigins: [config.baseURL],
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: false },
      },
      rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 100,
        customRules: {
          "/sign-in/email": { window: 60, max: 10 },
          "/sign-up/email": { window: 60, max: 5 },
        },
      },
      advanced: {
        useSecureCookies: config.secureCookies,
        defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
        // Keep Better Auth's origin and CSRF checks enabled, including in tests.
        disableOriginCheck: false,
        disableCSRFCheck: false,
      },
    });
    // Serialize the schema inspection and migration together across Node workers.
    // Busy timeout is configured before taking the SQLite write lock.
    database.exec("BEGIN IMMEDIATE");
    try {
      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    migrateAssessmentDatabase(database);
    return { auth, database, config };
  } catch (error) {
    database.close();
    throw error;
  }
}

export type ServerContext = Awaited<ReturnType<typeof initializeServer>>;
const serverState = globalThis as typeof globalThis & {
  healthMetricsServer?: Promise<ServerContext>;
};

/** One connection and one initialization promise per Node process, also during HMR. */
export function getServerContext(): Promise<ServerContext> {
  if (!serverState.healthMetricsServer) {
    serverState.healthMetricsServer = initializeServer().catch(
      (error: unknown) => {
        serverState.healthMetricsServer = undefined;
        throw error;
      },
    );
  }
  return serverState.healthMetricsServer;
}

export async function getAuth() {
  return (await getServerContext()).auth;
}

export async function getDatabase() {
  return (await getServerContext()).database;
}
