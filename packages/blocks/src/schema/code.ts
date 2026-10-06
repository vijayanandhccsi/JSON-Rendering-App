import { z } from "zod";
import { PlainText, RawText } from "./common";

export const CodeBlockSchema = z.strictObject({
  type: z.literal("code"),
  language: PlainText,
  title: PlainText.optional(),
  code: RawText,
});
