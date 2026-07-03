import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { TrayCard } from "./features/tray-card/TrayCard";
import "./app/globals.css";

const searchParams = new URLSearchParams(window.location.search);
const isTrayCard = searchParams.get("view") === "tray-card";
const Root = isTrayCard ? TrayCard : App;

if (isTrayCard) {
  document.documentElement.dataset.view = "tray-card";
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
