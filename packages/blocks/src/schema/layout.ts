import { z } from "zod";
import { IconName, PlainText } from "./common";

export const LayoutBlockSchema = z.strictObject({
  type: z.literal("layout"),
  variant: z.enum(["bento", "masonry", "metro", "modular"]),
  tiles: z
    .array(
      z.strictObject({
        title: PlainText,
        text: PlainText.optional(),
        icon: IconName.optional(),
        size: z.enum(["small", "wide", "tall", "large"]).optional(),
        tone: z.enum(["default", "primary", "secondary", "accent"]).optional(),
      }),
    )
    .min(1),
});
