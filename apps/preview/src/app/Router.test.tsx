import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { navigate, routeOf } from "./Router";

afterEach(() => window.history.pushState({}, "", "/"));

describe("routeOf", () => {
  it.each([
    ["/", "/"],
    ["/gallery", "/gallery"],
    ["/gallery/", "/gallery"],
    ["/batch", "/batch"],
  ])("%s is %s", (path, route) => expect(routeOf(path)).toBe(route));

  it.each(["/nope", "/gallery/x", "/Batch"])("%s is not a page", (path) =>
    expect(routeOf(path)).toBeNull(),
  );
});

describe("navigation", () => {
  it("has a main menu with the three pages, marking the current one", async () => {
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Pages" });
    await screen.findByRole("toolbar", { name: "Actions" });
    expect([...nav.querySelectorAll("a")].map((a) => a.textContent)).toEqual([
      "Editor",
      "Gallery",
      "Batch validate",
    ]);
    expect(screen.getByRole("link", { name: "Editor" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Gallery" })).not.toHaveAttribute("aria-current");
  });

  it("changes page without reloading, and the address changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("link", { name: "Batch validate" }));
    expect(window.location.pathname).toBe("/batch");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Batch validate" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Batch validate" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Editor" })).not.toHaveAttribute("aria-current");
  });

  it("opens the page named in the address, and follows the back button", async () => {
    window.history.pushState({}, "", "/gallery");
    render(<App />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Block gallery" }),
    ).toBeInTheDocument();
    act(() => {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(await screen.findByRole("toolbar", { name: "Actions" })).toBeInTheDocument();
  });

  it("only shows the editor's actions on the editor page", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("toolbar", { name: "Actions" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Gallery" }));
    await screen.findByRole("heading", { level: 1, name: "Block gallery" });
    expect(screen.queryByRole("toolbar", { name: "Actions" })).toBeNull();
  });

  it("leaves modified clicks to the browser (open in a new tab)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("toolbar", { name: "Actions" });
    await user.keyboard("{Control>}");
    await user.click(screen.getByRole("link", { name: "Gallery" }));
    await user.keyboard("{/Control}");
    expect(window.location.pathname).toBe("/");
  });

  it("shows a page-not-found message with a way back for an unknown address", async () => {
    window.history.pushState({}, "", "/nowhere");
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("link", { name: "Go to the editor" }));
    expect(window.location.pathname).toBe("/");
  });

  it("does nothing when navigating to the page already open", () => {
    const before = window.history.length;
    navigate("/");
    expect(window.history.length).toBe(before);
  });
});
