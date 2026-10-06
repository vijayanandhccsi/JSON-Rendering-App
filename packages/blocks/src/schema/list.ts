import { z } from "zod";
import { IconName, PlainText } from "./common";

const PlainListSchema = z.strictObject({
  type: z.literal("list"),
  style: z.enum(["bulleted", "numbered", "checklist"]),
  items: z.array(PlainText).min(1),
});

const IconListSchema = z.strictObject({
  type: z.literal("list"),
  style: z.literal("icon"),
  iconPosition: z.enum(["left", "right"]).optional(),
  items: z.array(z.strictObject({ text: PlainText, icon: IconName })).min(1),
});

export const ListBlockSchema = z.discriminatedUnion("style", [PlainListSchema, IconListSchema]);

/** Schema to use for each value of `style`, so errors can be reported per style. */
export const listVariants = {
  bulleted: PlainListSchema,
  numbered: PlainListSchema,
  checklist: PlainListSchema,
  icon: IconListSchema,
} as const;
