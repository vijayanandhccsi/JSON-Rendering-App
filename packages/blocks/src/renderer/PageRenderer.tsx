import type { Block, Page } from "../schema";
import { MediaProvider } from "../ui/MediaContext";
import { BlockRenderer } from "./BlockRenderer";

/** Blocks that may use the wide column (960 px). Everything else sits in the reading column (720 px). */
function isWide(block: Block): boolean {
  switch (block.type) {
    case "chart":
    case "layout":
    case "carousel":
    case "comparison":
      return true;
    case "image":
      return block.size === "full";
    default:
      return false;
  }
}

interface PageRendererProps {
  page: Page;
  /** Where image files live, for example "/media/". */
  mediaBaseUrl?: string;
}

/** The finished page, as a learner sees it. */
export function PageRenderer({ page, mediaBaseUrl = "/media/" }: PageRendererProps) {
  return (
    <MediaProvider baseUrl={mediaBaseUrl}>
      <article lang="en" className="mx-auto w-full max-w-wide bg-bg px-4 py-10 text-ink">
        <div className="flex flex-col gap-6">
          <div className="mx-auto w-full max-w-reading">
            <h1 className="text-title font-semibold">{page.title}</h1>
            {page.estimatedMinutes ? (
              <p className="mt-2 text-caption text-ink-muted">{page.estimatedMinutes} min read</p>
            ) : null}
          </div>
          {page.blocks.map((block, index) => (
            <div
              key={index}
              className={`mx-auto w-full ${isWide(block) ? "max-w-wide" : "max-w-reading"}`}
            >
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      </article>
    </MediaProvider>
  );
}
