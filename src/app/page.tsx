import HealthCalculator from "../components/health/HealthCalculator";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const query = await searchParams;
  return (
    <HealthCalculator initialLanguage={query.lang === "en" ? "en" : "th"} />
  );
}
