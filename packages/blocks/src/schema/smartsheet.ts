import { z } from "zod";
import { customIssue, PlainText } from "./common";

export const SmartsheetBlockSchema = z
  .strictObject({
    type: z.literal("smartsheet"),
    title: PlainText.optional(),
    headers: z.array(PlainText).min(1),
    rows: z.array(z.array(PlainText).min(1)).min(1),
  })
  .superRefine((block, ctx) => {
    block.rows.forEach((row, index) => {
      if (row.length !== block.headers.length) {
        customIssue(
          ctx,
          `has ${row.length} cells but there are ${block.headers.length} headers`,
          "Give every row exactly one string per header.",
          ["rows", index],
        );
      }
    });
  });
