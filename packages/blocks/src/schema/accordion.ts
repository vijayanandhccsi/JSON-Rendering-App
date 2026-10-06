import { z } from "zod";
import { PlainText } from "./common";
import { NestedBlocks } from "./nested";

export const AccordionBlockSchema = z.strictObject({
  type: z.literal("accordion"),
  items: z.array(z.strictObject({ title: PlainText, blocks: NestedBlocks })).min(1),
});
