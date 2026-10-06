import { z } from "zod";
import { PlainText } from "./common";
import { NestedBlocks } from "./nested";

export const ExpandableBlockSchema = z.strictObject({
  type: z.literal("expandable"),
  title: PlainText,
  blocks: NestedBlocks,
});
