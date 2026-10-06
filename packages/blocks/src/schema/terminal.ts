import { z } from "zod";
import { PlainText, RawText } from "./common";

export const TerminalBlockSchema = z.strictObject({
  type: z.literal("terminal"),
  title: PlainText.optional(),
  lines: z.array(z.strictObject({ kind: z.enum(["command", "output"]), text: RawText })).min(1),
});
