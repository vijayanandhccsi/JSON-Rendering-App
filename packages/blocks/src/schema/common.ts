import { z } from "zod";
import { closestMatch } from "../closestMatch";
import { ICON_NAMES } from "../icons/iconNames";

/** Issue code for an icon outside the curated set. */
export const ICON_NOT_ALLOWED = "icon-not-allowed";

/** Matches an opening, closing or self-closing HTML tag such as <b>, </div> or <br/>. */
const HTML_TAG = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>/i;

/**
 * A custom issue: `message` continues the sentence that starts with the field name.
 * `code` is an optional machine-readable name for the kind of problem.
 */
export function customIssue(
  ctx: z.RefinementCtx,
  message: string,
  fix: string,
  path?: (string | number)[],
  code?: string,
): void {
  ctx.addIssue({
    code: "custom",
    message,
    params: { fix, ...(code ? { code } : {}) },
    ...(path ? { path } : {}),
  });
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

const ALLOWED_ICONS: ReadonlySet<string> = new Set(ICON_NAMES);

/** An icon from the curated set (guide.md section 6). Any other name is an error. */
export const IconName = z.string().superRefine((value, ctx) => {
  if (ALLOWED_ICONS.has(value)) return;
  const guess = closestMatch(value, ICON_NAMES);
  customIssue(
    ctx,
    `uses the icon "${value}", which is not in the allowed icon list`,
    `${guess ? `Did you mean "${guess}"? ` : ""}Choose an icon from the allowed list in guide.md section 6, or leave the optional "icon" out.`,
    undefined,
    ICON_NOT_ALLOWED,
  );
});

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
