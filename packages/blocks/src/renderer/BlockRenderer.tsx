import { Accordion } from "../blocks/Accordion";
import { Callout } from "../blocks/Callout";
import { Card } from "../blocks/Card";
import { Carousel } from "../blocks/Carousel";
import { Code } from "../blocks/Code";
import { Comparison } from "../blocks/Comparison";
import { Expandable } from "../blocks/Expandable";
import { Flipcard } from "../blocks/Flipcard";
import { Grid } from "../blocks/Grid";
import { Heading } from "../blocks/Heading";
import { Image } from "../blocks/Image";
import { Layout } from "../blocks/Layout";
import { List } from "../blocks/List";
import { Paragraph } from "../blocks/Paragraph";
import { Quote } from "../blocks/Quote";
import { Smartsheet } from "../blocks/Smartsheet";
import { Tabs } from "../blocks/Tabs";
import { Terminal } from "../blocks/Terminal";
import { Timeline } from "../blocks/Timeline";
import { Video } from "../blocks/Video";
import type { Block } from "../schema";
import { Unsupported } from "./Unsupported";

/** Renders one block, without any page layout around it. */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return <Heading block={block} />;
    case "paragraph":
      return <Paragraph block={block} />;
    case "callout":
      return <Callout block={block} />;
    case "quote":
      return <Quote block={block} />;
    case "list":
      return <List block={block} />;
    case "image":
      return <Image block={block} />;
    case "video":
      return <Video block={block} />;
    case "code":
      return <Code block={block} />;
    case "terminal":
      return <Terminal block={block} />;
    case "accordion":
      return <Accordion block={block} />;
    case "tabs":
      return <Tabs block={block} />;
    case "expandable":
      return <Expandable block={block} />;
    case "flipcard":
      return <Flipcard block={block} />;
    case "timeline":
      return <Timeline block={block} />;
    case "carousel":
      return <Carousel block={block} />;
    case "comparison":
      return <Comparison block={block} />;
    case "smartsheet":
      return <Smartsheet block={block} />;
    case "grid":
      return <Grid block={block} />;
    case "card":
      return <Card block={block} />;
    case "layout":
      return <Layout block={block} />;
    default:
      return <Unsupported type={block.type} />;
  }
}

/** Blocks inside accordion, tabs and expandable: same spacing as the page, no width changes. */
export function NestedBlocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  );
}
