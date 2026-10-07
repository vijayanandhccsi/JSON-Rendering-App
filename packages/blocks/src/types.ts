import type { Block } from "./schema";

/** The block with the given `type`, for example `BlockOf<"heading">`. */
export type BlockOf<T extends Block["type"]> = Extract<Block, { type: T }>;
