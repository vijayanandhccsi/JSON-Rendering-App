import { z } from "zod";
import { ImageObject, PlainText } from "./common";

export const ImageBlockSchema = ImageObject.extend({
  type: z.literal("image"),
  caption: PlainText.optional(),
  size: z.enum(["small", "medium", "full"]).optional(),
});
