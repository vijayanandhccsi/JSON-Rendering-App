import { z } from "zod";
import { PlainText } from "./common";

export const CALLOUT_VARIANTS = ["info", "tip", "warning", "danger", "success"] as const;

export const CalloutBlockSchema = z.strictObject({
  type: z.literal("callout"),
  variant: z.enum(CALLOUT_VARIANTS),
  title: PlainText.optional(),
  text: PlainText,
});
