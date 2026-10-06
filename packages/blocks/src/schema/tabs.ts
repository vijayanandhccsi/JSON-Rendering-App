import { z } from "zod";
import { PlainText } from "./common";
import { NestedBlocks } from "./nested";

export const TabsBlockSchema = z.strictObject({
  type: z.literal("tabs"),
  tabs: z.array(z.strictObject({ label: PlainText, blocks: NestedBlocks })).min(1),
});
