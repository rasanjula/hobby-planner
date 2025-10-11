// client/src/components/Layout.tsx
import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar-outer">
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div className="brand">
            <span className="logo-badge">HP</span>
            <Link to="/" style={{ textDecoration: "none" }} aria-label="Go to home">
              <span style={{ fontWeight: 700, fontSize: "1.5rem", color: "#2563eb" }}>
                Hobby Planner
              </span>
            </Link>
          </div>

          {/* Primary blue button so it’s clearly visible on white */}
          <Link className="btn btn-primary" to="/create">
            Create session
          </Link>
        </div>
      </header>

      {/* Let each page control its own container/page layout */}
      <Outlet />
    </div>
  );
}
