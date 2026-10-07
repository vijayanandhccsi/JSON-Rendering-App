import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("shows the app name and the sample page", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toHaveTextContent("CertKraft page preview");
    expect(screen.getByRole("heading", { level: 1, name: "Full sample page" })).toBeInTheDocument();
  });
});
