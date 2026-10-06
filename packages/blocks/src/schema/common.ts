import { z } from "zod";

/** Matches an opening, closing or self-closing HTML tag such as <b>, </div> or <br/>. */
const HTML_TAG = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>/i;

/** A custom issue: `message` continues the sentence that starts with the field name. */
export function customIssue(
  ctx: z.RefinementCtx,
  message: string,
  fix: string,
  path?: (string | number)[],
): void {
  ctx.addIssue({ code: "custom", message, params: { fix }, ...(path ? { path } : {}) });
}

/** Plain text that may only use **bold**, *italic* and `code`. HTML tags are rejected. */
export const PlainText = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    if (HTML_TAG.test(value)) {
      customIssue(
        ctx,
        "contains an HTML tag. Only plain text is allowed",
        "Remove the HTML tag. Use **bold**, *italic* or `code` for formatting.",
      );
    }
  });

/** Text that is shown as-is (code and terminal output). Not checked for HTML. */
export const RawText = z.string().min(1);

/** A Lucide icon name in kebab-case. Unknown names are reported as a warning, not an error. */
export const IconName = z.string().min(1);

/** A position from 0 to 100, as a percentage from the top-left of an image. */
export const Coordinate = z.number().min(0).max(100);

const IMAGE_FILE = /^[a-z0-9-]+\.(webp|png|gif)$/;

export const ImageSrc = z.string().superRefine((value, ctx) => {
  if (value === "") {
    customIssue(
      ctx,
      "must not be empty",
      'Use the image file name only, for example "osi-model.webp".',
    );
  } else if (/[/\\:]/.test(value)) {
    customIssue(
      ctx,
      "is a path or URL. Use the file name only",
      'Replace it with the file name only, for example "osi-model.webp".',
    );
  } else if (!/\.(webp|png|gif)$/.test(value)) {
    customIssue(
      ctx,
      "must end in .webp, .png or .gif",
      "Use a .webp file (preferred), or .png or .gif.",
    );
  } else if (!IMAGE_FILE.test(value)) {
    customIssue(
      ctx,
      "may only use lowercase letters, digits and hyphens before the extension",
      'Rename it, for example "osi-model-layers.webp".',
    );
  }
});

/** The image object used inside several blocks. */
export const ImageObject = z.strictObject({
  src: ImageSrc,
  alt: PlainText,
  description: PlainText,
});

/** An image object with an optional label (beforeafter). */
export const LabelledImageObject = ImageObject.extend({ label: PlainText.optional() });
