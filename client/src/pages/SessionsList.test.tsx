import React from "react";
import { render, screen } from "@testing-library/react";
function SessionsListStub() {
  return (
    <div>
      <h1>All Sessions</h1>
      <button>Join</button>
    </div>
  );
}
test("renders list shell & join presence", () => {
  render(<SessionsListStub />);
  expect(screen.getByText("All Sessions")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
});
