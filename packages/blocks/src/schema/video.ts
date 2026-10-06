import { z } from "zod";
import { customIssue, PlainText } from "./common";

export const VideoBlockSchema = z.strictObject({
  type: z.literal("video"),
  provider: z.literal("vimeo"),
  id: z.string().superRefine((value, ctx) => {
    if (value !== "TBD" && !/^\d+$/.test(value)) {
      customIssue(
        ctx,
        'must be the Vimeo video number (digits only) or "TBD"',
        'Use only the number from the Vimeo link, for example "123456789". Never write a URL.',
      );
    }
  }),
  hash: z
    .string()
    .regex(/^[A-Za-z0-9]+$/, "must be letters and digits only")
    .optional(),
  title: PlainText,
  caption: PlainText.optional(),
});
