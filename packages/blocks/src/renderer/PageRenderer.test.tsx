import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PageSchema } from "../schema";
import { PageRenderer } from "./PageRenderer";

const valid = join(__dirname, "../../../../fixtures/pages/valid");
const load = (file: string) =>
  PageSchema.parse(JSON.parse(readFileSync(join(valid, file), "utf8")));

describe("PageRenderer", () => {
  it("sets the page language and renders the title as the only h1", () => {
    render(<PageRenderer page={load("guide-example.json")} />);
    expect(screen.getByRole("article")).toHaveAttribute("lang", "en");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("What is a firewall?");
  });

  it("puts wide blocks in the wide column and the rest in the reading column", () => {
    const base = load("block-paragraph.json");
    const page = {
      ...base,
      blocks: [
        base.blocks[0],
        ...load("block-image.json").blocks,
        { ...load("block-image.json").blocks[0], size: "full" as const },
        ...load("block-layout-bento.json").blocks,
      ],
      imageBriefs: load("block-image.json").imageBriefs,
    };
    const { container } = render(<PageRenderer page={page as typeof base} />);
    const wrappers = [...container.querySelectorAll("article > div > div:not(:first-child)")].map(
      (el) => el.className.includes("max-w-wide"),
    );
    expect(wrappers).toEqual([false, false, true, true]);
  });

  it("passes the media base URL down to images", () => {
    render(<PageRenderer page={load("block-image.json")} mediaBaseUrl="/lesson-media/" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/lesson-media/osi-model-layers.webp");
  });

  it("shows a placeholder for blocks that cannot be previewed yet, instead of failing", () => {
    render(<PageRenderer page={load("block-flipcard.json")} />);
    expect(screen.getByText(/valid but cannot be previewed yet/)).toBeVisible();
  });

  it.each(readdirSync(valid))("renders %s without throwing", (file) => {
    expect(() => render(<PageRenderer page={load(file)} />)).not.toThrow();
  });
});
