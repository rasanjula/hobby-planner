import { createBrowserRouter } from "react-router-dom";
import SessionsList from "./pages/SessionsList";
export const router = createBrowserRouter([
  { path: "/", element: <SessionsList /> },
  { path: "/create", element: <div>CreateSession (coming Day 3)</div> },
  { path: "/session/:id", element: <div>SessionDetails (Day 3)</div> },
  { path: "/session/:id/manage", element: <div>ManageSession (Day 5)</div> }
]);
