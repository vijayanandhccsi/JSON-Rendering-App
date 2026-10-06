import { z } from "zod";
import { PlainText } from "./common";

export const ParagraphBlockSchema = z.strictObject({
  type: z.literal("paragraph"),
  text: PlainText,
});
