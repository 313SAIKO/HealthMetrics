import { getServerContext } from "../src/server/auth";

async function main() {
  const { database } = await getServerContext();
  database.close();
  console.log(
    "HealthMetrics auth and assessment database migrations are up to date.",
  );
}

main().catch(() => {
  console.error(
    "Database migration failed. Check DATABASE_PATH, BETTER_AUTH_URL and BETTER_AUTH_SECRET.",
  );
  process.exitCode = 1;
});
