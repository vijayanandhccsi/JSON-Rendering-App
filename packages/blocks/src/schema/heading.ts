import { z } from "zod";
import { PlainText } from "./common";

export const HeadingBlockSchema = z.strictObject({
  type: z.literal("heading"),
  level: z.literal([2, 3, 4]),
  text: PlainText,
});
