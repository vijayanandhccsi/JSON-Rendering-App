import { z } from "zod";
import { IconName, PlainText } from "./common";

export const GridBlockSchema = z.strictObject({
  type: z.literal("grid"),
  variant: z.enum(["feature", "comparison"]),
  columns: z.literal([2, 3, 4]),
  items: z
    .array(
      z.strictObject({
        icon: IconName.optional(),
        badge: PlainText.optional(),
        title: PlainText,
        text: PlainText,
      }),
    )
    .min(1),
});
