import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import App from "./App";
import { NetworkProvider } from "./network/NetworkContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NetworkProvider>
      <App />
    </NetworkProvider>
  </StrictMode>,
);
