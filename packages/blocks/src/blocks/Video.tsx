import { VideoOff } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

function embedUrl(id: string, hash: string | undefined): string {
  const url = new URL(`https://player.vimeo.com/video/${id}`);
  if (hash) url.searchParams.set("h", hash);
  url.searchParams.set("dnt", "1");
  return url.toString();
}

export function Video({ block }: { block: BlockOf<"video"> }) {
  return (
    <figure>
      {block.id === "TBD" ? (
        <div className="flex aspect-video items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface p-5 text-ink-muted">
          <VideoOff size={24} strokeWidth={ICON_STROKE_WIDTH} aria-hidden className="shrink-0" />
          <p>Video not available yet: {block.title}</p>
        </div>
      ) : (
        <iframe
          src={embedUrl(block.id, block.hash)}
          title={block.title}
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-card border border-border"
        />
      )}
      {block.caption ? (
        <figcaption className="mt-2 text-caption text-ink-muted">
          <InlineText text={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}
