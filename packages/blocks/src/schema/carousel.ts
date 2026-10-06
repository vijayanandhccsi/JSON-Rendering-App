import { z } from "zod";
import { customIssue, ImageObject, PlainText } from "./common";

const SlideSchema = z
  .strictObject({
    title: PlainText.optional(),
    text: PlainText.optional(),
    image: ImageObject.optional(),
  })
  .superRefine((slide, ctx) => {
    if (slide.text === undefined && slide.image === undefined) {
      customIssue(
        ctx,
        'needs at least one of "text" or "image"',
        'Add a "text" or an "image" to this slide.',
      );
    }
  });

export const CarouselBlockSchema = z.strictObject({
  type: z.literal("carousel"),
  slides: z.array(SlideSchema).min(1),
});
