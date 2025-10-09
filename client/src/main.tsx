import 'leaflet/dist/leaflet.css';
import './lib/leaflet-icons';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles.css"; // <- include if you created D2-16 styles

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);