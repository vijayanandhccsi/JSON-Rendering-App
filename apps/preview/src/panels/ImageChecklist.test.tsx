import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractBriefs } from "../lib/briefs";
import { ImageChecklist } from "./ImageChecklist";

/** A stand-in for the browser's Image that lets a test decide which files load. */
class FakeImage {
  static all: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private source = "";
  constructor() {
    FakeImage.all.push(this);
  }
  get src() {
    return this.source;
  }
  set src(value: string) {
    this.source = value;
  }
}
const settle = (found: (url: string) => boolean) =>
  act(() => {
    for (const image of FakeImage.all) (found(image.src) ? image.onload : image.onerror)?.();
  });

beforeEach(() => {
  FakeImage.all = [];
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => vi.unstubAllGlobals());

const briefs = [
  { file: "osi-model.webp", brief: "Seven stacked layers." },
  { file: "topology.png", brief: "A router and a firewall." },
  { file: "console.gif", brief: "" },
];

const show = (base = "/media/", onNotice = vi.fn()) =>
  render(<ImageChecklist briefs={briefs} mediaBaseUrl={base} onNotice={onNotice} />);

describe("extractBriefs", () => {
  it("reads the image briefs from the page JSON", () => {
    expect(
      extractBriefs(
        JSON.stringify({ imageBriefs: [{ file: "a.webp", brief: "A" }, { file: "b.webp" }] }),
      ),
    ).toEqual([
      { file: "a.webp", brief: "A" },
      { file: "b.webp", brief: "" },
    ]);
  });

  it("skips entries it cannot use, and returns nothing for broken or missing data", () => {
    expect(
      extractBriefs(
        JSON.stringify({
          imageBriefs: [
            null,
            5,
            { brief: "no file" },
            { file: "" },
            { file: "ok.png", brief: "x" },
          ],
        }),
      ),
    ).toEqual([{ file: "ok.png", brief: "x" }]);
    expect(extractBriefs("{oops")).toEqual([]);
    expect(extractBriefs("{}")).toEqual([]);
    expect(extractBriefs(JSON.stringify({ imageBriefs: "nope" }))).toEqual([]);
  });
});

describe("image checklist", () => {
  it("summarizes while checking, then shows how many images are found", async () => {
    show();
    expect(screen.getByRole("button", { name: "Images: checking 3" })).toBeInTheDocument();
    settle((url) => url !== "/media/topology.png");
    expect(await screen.findByRole("button", { name: "Images: 2 of 3 found" })).toBeInTheDocument();
  });

  it("looks for each file under the media folder, and lists the file, the brief and Found or Missing", async () => {
    const user = userEvent.setup();
    show("https://cdn.example.com/lesson");
    expect(FakeImage.all.map((image) => image.src)).toEqual([
      "https://cdn.example.com/lesson/osi-model.webp",
      "https://cdn.example.com/lesson/topology.png",
      "https://cdn.example.com/lesson/console.gif",
    ]);
    settle((url) => url.endsWith(".webp"));
    await user.click(screen.getByRole("button", { name: /^Images:/ }));
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Foundosi-model.webpSeven stacked layers.");
    expect(rows[1]).toHaveTextContent("Missingtopology.pngA router and a firewall.");
    expect(rows[2]).toHaveTextContent("Missingconsole.gif");
    expect(screen.getByText("https://cdn.example.com/lesson", { selector: "span" })).toBeVisible();
  });

  it("is collapsed until opened", async () => {
    const user = userEvent.setup();
    show();
    const toggle = screen.getByRole("button", { name: /^Images:/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("image-list")).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("checks again on request", async () => {
    const user = userEvent.setup();
    show();
    settle(() => false);
    await user.click(screen.getByRole("button", { name: /^Images:/ }));
    await user.click(screen.getByRole("button", { name: "Check again" }));
    expect(FakeImage.all).toHaveLength(6);
    settle(() => true);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Images: 3 of 3 found" })).toBeInTheDocument(),
    );
  });

  it("copies the missing images with their briefs, ready to send to the designer", async () => {
    const user = userEvent.setup();
    const onNotice = vi.fn();
    show("/media/", onNotice);
    settle((url) => url.endsWith(".webp"));
    await user.click(screen.getByRole("button", { name: /^Images:/ }));
    await user.click(screen.getByRole("button", { name: "Copy missing" }));
    expect(await navigator.clipboard.readText()).toBe(
      "Images still needed (/media/):\n- topology.png: A router and a firewall.\n- console.gif",
    );
    expect(onNotice).toHaveBeenCalledWith("Copied the list of missing images.");
  });

  it("cannot copy when nothing is missing", async () => {
    const user = userEvent.setup();
    show();
    settle(() => true);
    await user.click(screen.getByRole("button", { name: /^Images:/ }));
    expect(screen.getByRole("button", { name: "Copy missing" })).toBeDisabled();
  });

  it("says so when the page lists no images", async () => {
    const user = userEvent.setup();
    render(<ImageChecklist briefs={[]} mediaBaseUrl="/media/" onNotice={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "Images: none listed" }));
    expect(
      within(screen.getByRole("region", { name: "Images" })).getByText(/lists no images/),
    ).toBeVisible();
    expect(FakeImage.all).toHaveLength(0);
  });

  it("shows Found and Missing with icons and words, not color alone", async () => {
    const user = userEvent.setup();
    const { container } = show();
    settle((url) => url.endsWith(".webp"));
    await user.click(screen.getByRole("button", { name: /^Images:/ }));
    expect(container.querySelectorAll("svg.lucide-circle-check")).toHaveLength(1);
    expect(container.querySelectorAll("svg.lucide-circle-x")).toHaveLength(2);
  });
});
