// client/src/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import SessionsList from "./pages/SessionsList";
import CreateSession from "./pages/CreateSession";
import SessionDetails from "./pages/SessionDetails";
import ManageSession from "./pages/ManageSession";

export const router = createBrowserRouter([
  {
    path: "/",                 // parent route
    element: <Layout />,
    children: [
      { index: true, element: <SessionsList /> },                // "/"
      { path: "create", element: <CreateSession /> },            // "/create"

      // Public/ID details
      { path: "session/:id", element: <SessionDetails /> },      // "/session/SESSION_ID"

      // 🔹 Private link by code
      // We deliberately reuse the param name ':id' so your SessionDetails
      // can keep trying getSessionById(id) -> catch -> getSessionByCode(id)
      { path: "session/by-code/:id", element: <SessionDetails /> },

      // Manage
      { path: "session/:id/manage", element: <ManageSession /> }, // "/session/:id/manage"

      { path: "*", element: <div className="empty">Not found.</div> },
    ],
  },
]);
