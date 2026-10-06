import { z } from "zod";
import { PlainText } from "./common";

export const KanbanBlockSchema = z.strictObject({
  type: z.literal("kanban"),
  columns: z
    .array(
      z.strictObject({
        title: PlainText,
        cards: z.array(z.strictObject({ title: PlainText, text: PlainText.optional() })),
      }),
    )
    .min(1),
});
