import { z } from "zod";
import { customIssue, PlainText } from "./common";

export const ScenarioBlockSchema = z
  .strictObject({
    type: z.literal("scenario"),
    title: PlainText.optional(),
    situation: PlainText,
    question: PlainText,
    options: z
      .array(z.strictObject({ text: PlainText, correct: z.boolean(), feedback: PlainText }))
      .min(2),
  })
  .superRefine((block, ctx) => {
    const correct = block.options.filter((option) => option.correct).length;
    if (correct !== 1) {
      customIssue(
        ctx,
        `must have exactly one option with "correct": true (found ${correct})`,
        'Set "correct": true on exactly one option and "correct": false on the others.',
        ["options"],
      );
    }
  });
