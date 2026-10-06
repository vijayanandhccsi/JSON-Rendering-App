import { z } from "zod";
import { AccordionBlockSchema } from "./accordion";
import { BeforeAfterBlockSchema } from "./beforeafter";
import { CalloutBlockSchema } from "./callout";
import { CardBlockSchema } from "./card";
import { CarouselBlockSchema } from "./carousel";
import { ChartBlockSchema, chartVariants } from "./chart";
import { CodeBlockSchema } from "./code";
import { ComparisonBlockSchema } from "./comparison";
import { DragDropBlockSchema, dragDropVariants } from "./dragdrop";
import { ExpandableBlockSchema } from "./expandable";
import { FlipcardBlockSchema } from "./flipcard";
import { GridBlockSchema } from "./grid";
import { HeadingBlockSchema } from "./heading";
import { HotspotBlockSchema } from "./hotspot";
import { ImageBlockSchema } from "./image";
import { KanbanBlockSchema } from "./kanban";
import { LayoutBlockSchema } from "./layout";
import { ListBlockSchema, listVariants } from "./list";
import { ParagraphBlockSchema } from "./paragraph";
import { QuoteBlockSchema } from "./quote";
import { ScenarioBlockSchema } from "./scenario";
import { SmartsheetBlockSchema } from "./smartsheet";
import { TabsBlockSchema } from "./tabs";
import { TerminalBlockSchema } from "./terminal";
import { TimelineBlockSchema } from "./timeline";
import { TimerBlockSchema } from "./timer";
import { VideoBlockSchema } from "./video";

export {
  AccordionBlockSchema,
  BeforeAfterBlockSchema,
  CalloutBlockSchema,
  CardBlockSchema,
  CarouselBlockSchema,
  ChartBlockSchema,
  CodeBlockSchema,
  ComparisonBlockSchema,
  DragDropBlockSchema,
  ExpandableBlockSchema,
  FlipcardBlockSchema,
  GridBlockSchema,
  HeadingBlockSchema,
  HotspotBlockSchema,
  ImageBlockSchema,
  KanbanBlockSchema,
  LayoutBlockSchema,
  ListBlockSchema,
  ParagraphBlockSchema,
  QuoteBlockSchema,
  ScenarioBlockSchema,
  SmartsheetBlockSchema,
  TabsBlockSchema,
  TerminalBlockSchema,
  TimelineBlockSchema,
  TimerBlockSchema,
  VideoBlockSchema,
};

export const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "callout",
  "quote",
  "list",
  "image",
  "video",
  "code",
  "terminal",
  "accordion",
  "tabs",
  "expandable",
  "flipcard",
  "timeline",
  "carousel",
  "hotspot",
  "dragdrop",
  "beforeafter",
  "kanban",
  "timer",
  "comparison",
  "scenario",
  "smartsheet",
  "grid",
  "card",
  "layout",
  "chart",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const CONTAINER_TYPES = ["accordion", "tabs", "expandable"] as const;

/** One schema per block type. */
export const BLOCK_SCHEMAS = {
  heading: HeadingBlockSchema,
  paragraph: ParagraphBlockSchema,
  callout: CalloutBlockSchema,
  quote: QuoteBlockSchema,
  list: ListBlockSchema,
  image: ImageBlockSchema,
  video: VideoBlockSchema,
  code: CodeBlockSchema,
  terminal: TerminalBlockSchema,
  accordion: AccordionBlockSchema,
  tabs: TabsBlockSchema,
  expandable: ExpandableBlockSchema,
  flipcard: FlipcardBlockSchema,
  timeline: TimelineBlockSchema,
  carousel: CarouselBlockSchema,
  hotspot: HotspotBlockSchema,
  dragdrop: DragDropBlockSchema,
  beforeafter: BeforeAfterBlockSchema,
  kanban: KanbanBlockSchema,
  timer: TimerBlockSchema,
  comparison: ComparisonBlockSchema,
  scenario: ScenarioBlockSchema,
  smartsheet: SmartsheetBlockSchema,
  grid: GridBlockSchema,
  card: CardBlockSchema,
  layout: LayoutBlockSchema,
  chart: ChartBlockSchema,
} as const satisfies Record<BlockType, z.ZodType>;

/** For blocks whose shape depends on one field, the field and the schema for each value. */
export const BLOCK_VARIANTS: Partial<
  Record<BlockType, { key: string; schemas: Record<string, z.ZodType> }>
> = {
  list: { key: "style", schemas: listVariants },
  dragdrop: { key: "mode", schemas: dragDropVariants },
  chart: { key: "chartType", schemas: chartVariants },
};

export const BlockSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  CalloutBlockSchema,
  QuoteBlockSchema,
  ListBlockSchema,
  ImageBlockSchema,
  VideoBlockSchema,
  CodeBlockSchema,
  TerminalBlockSchema,
  AccordionBlockSchema,
  TabsBlockSchema,
  ExpandableBlockSchema,
  FlipcardBlockSchema,
  TimelineBlockSchema,
  CarouselBlockSchema,
  HotspotBlockSchema,
  DragDropBlockSchema,
  BeforeAfterBlockSchema,
  KanbanBlockSchema,
  TimerBlockSchema,
  ComparisonBlockSchema,
  ScenarioBlockSchema,
  SmartsheetBlockSchema,
  GridBlockSchema,
  CardBlockSchema,
  LayoutBlockSchema,
  ChartBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;
