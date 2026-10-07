import { Callout } from "../blocks/Callout";
import { Code } from "../blocks/Code";
import { Heading } from "../blocks/Heading";
import { Image } from "../blocks/Image";
import { List } from "../blocks/List";
import { Paragraph } from "../blocks/Paragraph";
import { Quote } from "../blocks/Quote";
import { Terminal } from "../blocks/Terminal";
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
