import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

async function cleanStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    const swPort = new URL(reg.scope).port;
    if (swPort !== window.location.port) {
      await reg.unregister();
      console.log(`Unregistered stale SW from port ${swPort}`);
    }
  }
}

cleanStaleServiceWorkers().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <Provider>
          <ThemeProvider attribute="data-theme" defaultTheme="light">
            <App />
          </ThemeProvider>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>,
  );

  registerSW({
    immediate: true,
    onRegistered() {
      console.log("Service Worker Registered");
    },
    onRegisterError(err) {
      console.error("SW registration failed:", err);
    },
  });
});
