import "leaflet/dist/leaflet.css";
import "./lib/leaflet-icons";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

/* Existing global styles (keep if you need them) */
// import "./index.css";
// import "./styles.css"; 

/* NEW: light theme (import last so it overrides older rules) */
import "./styles/light.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
