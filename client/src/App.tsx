import "./styles.css";
import "./Styles/light.css";
import "leaflet/dist/leaflet.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
