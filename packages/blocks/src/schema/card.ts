import { z } from "zod";
import { IconName, PlainText } from "./common";

export const CardBlockSchema = z.strictObject({
  type: z.literal("card"),
  variant: z.enum(["default", "highlight"]).optional(),
  icon: IconName.optional(),
  title: PlainText,
  text: PlainText.optional(),
});
