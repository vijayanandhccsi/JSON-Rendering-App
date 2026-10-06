import { z } from "zod";
import { BlockSchema } from "./block";
import { PlainText } from "./common";

const CHAPTER_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const pageFields = {
  chapter: z.string().regex(CHAPTER_SLUG, "must be a lowercase hyphenated slug"),
  title: PlainText,
  summary: PlainText,
  estimatedMinutes: z.number().int().positive().optional(),
  imageBriefs: z.array(z.strictObject({ file: z.string().min(1), brief: PlainText })).optional(),
  authorNotes: z.array(PlainText).optional(),
};

export const PageSchema = z.strictObject({
  ...pageFields,
  blocks: z.array(BlockSchema).min(1),
});

/** The page without checking block contents. validatePage() checks each block separately. */
export const PageShellSchema = z.strictObject({
  ...pageFields,
  blocks: z.array(z.unknown()).min(1),
});

export type Page = z.infer<typeof PageSchema>;
