import { z } from "zod";
import { PlainText } from "./common";

export const FlipcardBlockSchema = z.strictObject({
  type: z.literal("flipcard"),
  cards: z.array(z.strictObject({ front: PlainText, back: PlainText })).min(1),
});
