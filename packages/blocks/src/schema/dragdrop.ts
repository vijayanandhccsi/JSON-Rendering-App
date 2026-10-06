import { z } from "zod";
import { Coordinate, ImageObject, PlainText } from "./common";

const base = { type: z.literal("dragdrop"), prompt: PlainText, hint: PlainText.optional() };

const MatchSchema = z.strictObject({
  ...base,
  mode: z.literal("match"),
  pairs: z.array(z.strictObject({ left: PlainText, right: PlainText })).min(1),
});

const OrderSchema = z.strictObject({
  ...base,
  mode: z.literal("order"),
  items: z.array(PlainText).min(1),
});

const LabelSchema = z.strictObject({
  ...base,
  mode: z.literal("label"),
  image: ImageObject,
  labels: z.array(z.strictObject({ text: PlainText, x: Coordinate, y: Coordinate })).min(1),
});

export const DragDropBlockSchema = z.discriminatedUnion("mode", [
  MatchSchema,
  OrderSchema,
  LabelSchema,
]);

export const dragDropVariants = {
  match: MatchSchema,
  order: OrderSchema,
  label: LabelSchema,
} as const;
