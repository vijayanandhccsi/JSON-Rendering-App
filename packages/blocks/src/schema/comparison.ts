import { z } from "zod";
import { PlainText } from "./common";

const Side = z.strictObject({ title: PlainText, points: z.array(PlainText).min(1) });

export const ComparisonBlockSchema = z.strictObject({
  type: z.literal("comparison"),
  left: Side,
  right: Side,
});
