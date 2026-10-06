import { z } from "zod";
import { CalloutBlockSchema } from "./callout";
import { CodeBlockSchema } from "./code";
import { ImageBlockSchema } from "./image";
import { ListBlockSchema } from "./list";
import { ParagraphBlockSchema } from "./paragraph";
import { QuoteBlockSchema } from "./quote";
import { SmartsheetBlockSchema } from "./smartsheet";
import { TerminalBlockSchema } from "./terminal";

export const NESTED_BLOCK_TYPES = [
  "paragraph",
  "list",
  "callout",
  "quote",
  "code",
  "terminal",
  "image",
  "smartsheet",
] as const;

/** The only blocks allowed inside accordion, tabs and expandable. */
export const NestedBlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema,
  ListBlockSchema,
  CalloutBlockSchema,
  QuoteBlockSchema,
  CodeBlockSchema,
  TerminalBlockSchema,
  ImageBlockSchema,
  SmartsheetBlockSchema,
]);

export const NestedBlocks = z.array(NestedBlockSchema).min(1);
