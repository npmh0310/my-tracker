import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./app/ErrorBoundary";
import "./app/globals.css";

const searchParams = new URLSearchParams(window.location.search);
const isTrayCard = searchParams.get("view") === "tray-card";

if (isTrayCard) {
  document.documentElement.dataset.view = "tray-card";
}

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

async function renderApp() {
  const { default: Root } = isTrayCard
    ? await import("./features/tray-card/TrayCard")
    : await import("./App");

  root.render(
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>,
  );
}

void renderApp();
