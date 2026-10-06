import { z } from "zod";
import { LabelledImageObject } from "./common";

export const BeforeAfterBlockSchema = z.strictObject({
  type: z.literal("beforeafter"),
  before: LabelledImageObject,
  after: LabelledImageObject,
});
