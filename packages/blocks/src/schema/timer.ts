import { z } from "zod";
import { customIssue, PlainText } from "./common";

export const TimerBlockSchema = z
  .strictObject({
    type: z.literal("timer"),
    mode: z.enum(["countdown", "timer"]),
    seconds: z.number().int().positive().optional(),
    label: PlainText.optional(),
    message: PlainText.optional(),
  })
  .superRefine((block, ctx) => {
    if (block.mode === "countdown" && block.seconds === undefined) {
      customIssue(
        ctx,
        'is required when mode is "countdown"',
        'Add "seconds" with the countdown length as a whole number, for example 300.',
        ["seconds"],
      );
    }
  });
