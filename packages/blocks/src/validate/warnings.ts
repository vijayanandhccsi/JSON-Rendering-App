import { LUCIDE_ICON_NAMES } from "./icons";
import type { ValidationIssue } from "./types";
import { closestMatch, isRecord, pathToString } from "./util";
import type { PathSegment } from "./util";

const MAX_PARAGRAPH_WORDS = 80;

interface BlockRef {
  block: Record<string, unknown>;
  path: PathSegment[];
  blockIndex: number;
}

/** Every block on the page, including blocks nested in accordion, tabs and expandable. */
function* walkBlocks(
  blocks: unknown,
  basePath: PathSegment[],
  blockIndex?: number,
): Generator<BlockRef> {
  if (!Array.isArray(blocks)) return;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!isRecord(block)) continue;
    const path = [...basePath, i];
    const index = blockIndex ?? i;
    yield { block, path, blockIndex: index };
    if (block.type === "accordion" && Array.isArray(block.items)) {
      for (let j = 0; j < block.items.length; j++) {
        const item: unknown = block.items[j];
        if (isRecord(item)) yield* walkBlocks(item.blocks, [...path, "items", j, "blocks"], index);
      }
    } else if (block.type === "tabs" && Array.isArray(block.tabs)) {
      for (let j = 0; j < block.tabs.length; j++) {
        const tab: unknown = block.tabs[j];
        if (isRecord(tab)) yield* walkBlocks(tab.blocks, [...path, "tabs", j, "blocks"], index);
      }
    } else if (block.type === "expandable") {
      yield* walkBlocks(block.blocks, [...path, "blocks"], index);
    }
  }
}

interface Found {
  value: string;
  path: PathSegment[];
}

function imagesIn(block: Record<string, unknown>, path: PathSegment[]): Found[] {
  const found: Found[] = [];
  const add = (image: unknown, imagePath: PathSegment[]) => {
    if (isRecord(image) && typeof image.src === "string") {
      found.push({ value: image.src, path: [...imagePath, "src"] });
    }
  };
  switch (block.type) {
    case "image":
      add(block, path);
      break;
    case "hotspot":
    case "dragdrop":
      add(block.image, [...path, "image"]);
      break;
    case "beforeafter":
      add(block.before, [...path, "before"]);
      add(block.after, [...path, "after"]);
      break;
    case "carousel":
      if (Array.isArray(block.slides)) {
        block.slides.forEach((slide: unknown, i) => {
          if (isRecord(slide)) add(slide.image, [...path, "slides", i, "image"]);
        });
      }
      break;
  }
  return found;
}

function iconsIn(block: Record<string, unknown>, path: PathSegment[]): Found[] {
  const found: Found[] = [];
  const add = (item: unknown, itemPath: PathSegment[]) => {
    if (isRecord(item) && typeof item.icon === "string") {
      found.push({ value: item.icon, path: [...itemPath, "icon"] });
    }
  };
  const addAll = (items: unknown, key: string) => {
    if (Array.isArray(items)) items.forEach((item: unknown, i) => add(item, [...path, key, i]));
  };
  switch (block.type) {
    case "card":
      add(block, path);
      break;
    case "list":
      if (block.style === "icon") addAll(block.items, "items");
      break;
    case "grid":
      addAll(block.items, "items");
      break;
    case "layout":
      addAll(block.tiles, "tiles");
      break;
  }
  return found;
}

/** Problems that do not stop a page from working but should be looked at. */
export function collectWarnings(page: Record<string, unknown>): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  const warn = (
    blockIndex: number | null,
    blockType: string | null,
    path: PathSegment[],
    message: string,
    fix: string,
  ) =>
    warnings.push({
      severity: "warning",
      blockIndex,
      blockType,
      path: pathToString(path),
      message,
      fix,
    });

  const images: (Found & { blockIndex: number; blockType: string })[] = [];

  for (const { block, path, blockIndex } of walkBlocks(page.blocks, ["blocks"])) {
    const blockType = typeof block.type === "string" ? block.type : null;

    if (block.type === "paragraph" && typeof block.text === "string") {
      const words = block.text.trim().split(/\s+/).filter(Boolean).length;
      if (words > MAX_PARAGRAPH_WORDS) {
        warn(
          blockIndex,
          blockType,
          [...path, "text"],
          `This paragraph has ${words} words. Paragraphs should be ${MAX_PARAGRAPH_WORDS} words or fewer.`,
          "Split it into two paragraphs, or move detail into a list, callout or accordion.",
        );
      }
    }

    if (block.type === "video" && block.id === "TBD") {
      warn(
        blockIndex,
        blockType,
        [...path, "id"],
        'The video id is "TBD", so no video will play.',
        'Replace "TBD" with the Vimeo video number before publishing.',
      );
    }

    for (const image of imagesIn(block, path)) {
      images.push({ ...image, blockIndex, blockType: blockType ?? "image" });
    }

    for (const icon of iconsIn(block, path)) {
      if (!LUCIDE_ICON_NAMES.has(icon.value)) {
        const suggestion = closestMatch(icon.value, [...LUCIDE_ICON_NAMES]);
        warn(
          blockIndex,
          blockType,
          icon.path,
          `The icon "${icon.value}" is not a Lucide icon name. A plain circle will be shown instead.`,
          suggestion
            ? `Use a real Lucide icon name in kebab-case. Did you mean "${suggestion}"?`
            : "Use a real Lucide icon name in kebab-case, for example shield-check, server or lock.",
        );
      }
    }
  }

  const briefs = Array.isArray(page.imageBriefs) ? page.imageBriefs : undefined;
  const briefFiles = new Map<string, number>();
  briefs?.forEach((brief: unknown, i) => {
    if (isRecord(brief) && typeof brief.file === "string") briefFiles.set(brief.file, i);
  });

  if (images.length > 0 && (briefs === undefined || briefs.length === 0)) {
    warn(
      null,
      null,
      ["imageBriefs"],
      '"imageBriefs" is missing, but the page uses images.',
      'Add "imageBriefs" with one { "file", "brief" } entry for each image file.',
    );
  } else if (briefs !== undefined) {
    const used = new Set(images.map((image) => image.value));
    for (const image of images) {
      if (!briefFiles.has(image.value)) {
        warn(
          image.blockIndex,
          image.blockType,
          image.path,
          `The image "${image.value}" is not listed in "imageBriefs".`,
          `Add { "file": "${image.value}", "brief": "..." } to "imageBriefs".`,
        );
      }
    }
    for (const [file, index] of briefFiles) {
      if (!used.has(file)) {
        warn(
          null,
          null,
          ["imageBriefs", index, "file"],
          `"imageBriefs" lists "${file}", but no image on the page uses it.`,
          "Remove the entry, or add an image block that uses this file.",
        );
      }
    }
  }

  return warnings;
}
