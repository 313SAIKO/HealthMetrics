import { createRoot } from "react-dom/client";
import { DemoWorkspace } from "../components/demo/DemoWorkspace";

const language =
  new URLSearchParams(window.location.search).get("lang") === "en"
    ? "en"
    : "th";
createRoot(document.getElementById("root")!).render(
  <DemoWorkspace initialLanguage={language} standalone />,
);
