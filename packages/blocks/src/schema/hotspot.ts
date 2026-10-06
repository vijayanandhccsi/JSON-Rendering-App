import { z } from "zod";
import { Coordinate, ImageObject, PlainText } from "./common";

export const HotspotBlockSchema = z.strictObject({
  type: z.literal("hotspot"),
  image: ImageObject,
  hotspots: z
    .array(z.strictObject({ x: Coordinate, y: Coordinate, title: PlainText, text: PlainText }))
    .min(1),
});
