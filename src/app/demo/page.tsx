import { DemoWorkspace } from "../../components/demo/DemoWorkspace";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  return <DemoWorkspace initialLanguage={params.lang === "en" ? "en" : "th"} />;
}
