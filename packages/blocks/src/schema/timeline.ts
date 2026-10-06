import { z } from "zod";
import { PlainText } from "./common";

export const TimelineBlockSchema = z.strictObject({
  type: z.literal("timeline"),
  orientation: z.enum(["vertical", "horizontal"]),
  steps: z
    .array(z.strictObject({ label: PlainText.optional(), title: PlainText, text: PlainText }))
    .min(1),
});
