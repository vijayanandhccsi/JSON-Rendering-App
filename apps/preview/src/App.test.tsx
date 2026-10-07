import { render, screen, within } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("shows the app name and the sample page", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toHaveTextContent("CertKraft page preview");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Full sample page" })).toBeInTheDocument();
  });

  it("shows the page details in a panel outside the page", () => {
    render(<App />);
    const info = screen.getByRole("complementary", { name: "Page info" });
    expect(within(info).getByText("network-security-basics")).toBeInTheDocument();
    expect(within(info).getByText(/A page used to test the validator/)).toBeInTheDocument();
    expect(within(info).getByText("20 min")).toBeInTheDocument();
    expect(info.closest("article")).toBeNull();
  });

  it("shows the reading time under the page title for learners", () => {
    render(<App />);
    expect(screen.getByText("20 min read")).toBeInTheDocument();
  });
});
