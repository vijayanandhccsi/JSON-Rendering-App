import { z } from "zod";
import { PlainText } from "./common";

export const QuoteBlockSchema = z.strictObject({
  type: z.literal("quote"),
  text: PlainText,
  source: PlainText.optional(),
});
