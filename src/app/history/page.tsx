import { HistoryWorkspace } from "../../components/history/HistoryWorkspace";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  return (
    <HistoryWorkspace initialLanguage={params.lang === "en" ? "en" : "th"} />
  );
}
