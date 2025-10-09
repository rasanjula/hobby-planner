import { createBrowserRouter } from "react-router-dom";
import SessionsList from "./pages/SessionsList";
import CreateSession from "./pages/CreateSession";
import SessionDetails from "./pages/SessionDetails";
import ManageSession from "./pages/ManageSession";
export const router = createBrowserRouter([
  { path: "/", element: <SessionsList /> },
  { path: "/create", element: <CreateSession /> },
  { path: "/session/:id", element: <SessionDetails /> },
  { path: "/session/:id/manage", element: <ManageSession /> }
]);
