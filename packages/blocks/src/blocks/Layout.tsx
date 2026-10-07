import { Icon } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

type Tile = BlockOf<"layout">["tiles"][number];
type Size = NonNullable<Tile["size"]>;
type Tone = NonNullable<Tile["tone"]>;

// White text on primary-strong, ink and success-strong all pass AA (see DESIGN.md).
const TONES: Record<Tone, string> = {
  default: "border border-border bg-surface text-ink",
  primary: "bg-primary-strong text-surface",
  secondary: "bg-ink text-surface",
  accent: "bg-success-strong text-surface",
};

// Tiles span grid cells on wider layouts and stack in one column on narrow ones.
const GRID_SPANS: Record<Size, string> = {
  small: "",
  wide: "@md:col-span-2",
  tall: "@md:row-span-2",
  large: "@md:col-span-2 @md:row-span-2",
};

const MODULAR_SPANS: Record<Size, string> = {
  small: "@md:col-span-3",
  wide: "@md:col-span-6",
  tall: "@md:col-span-3 @md:row-span-2",
  large: "@md:col-span-6 @md:row-span-2",
};

const FRAMES = {
  bento: "grid gap-4 @md:grid-cols-4 grid-flow-dense",
  metro: "grid gap-2 @md:grid-cols-4 grid-flow-dense",
  modular: "grid gap-4 @md:grid-cols-12 grid-flow-dense",
  masonry: "gap-4 @md:columns-2 @2xl:columns-3",
} as const;

function TileContent({ tile, bold }: { tile: Tile; bold: boolean }) {
  return (
    <>
      {tile.icon ? <Icon name={tile.icon} size={24} className="mb-3" /> : null}
      <p className={`text-h4 ${bold ? "font-semibold" : "font-medium"}`}>
        <InlineText text={tile.title} />
      </p>
      {tile.text ? (
        <p className="mt-1">
          <InlineText text={tile.text} />
        </p>
      ) : null}
    </>
  );
}

export function Layout({ block }: { block: BlockOf<"layout"> }) {
  const { variant } = block;
  const metro = variant === "metro";
  const radius = metro ? "rounded-sm" : "rounded-card";

  return (
    <div className="@container">
      <ul role="list" className={FRAMES[variant]}>
        {block.tiles.map((tile, index) => {
          // Bento needs one large tile: if no sizes are given, the first tile is the large one.
          const size: Size =
            tile.size ??
            (variant === "bento" && index === 0 && block.tiles.every((t) => !t.size)
              ? "large"
              : "small");
          const spans =
            variant === "masonry"
              ? "mb-4 break-inside-avoid"
              : variant === "modular"
                ? MODULAR_SPANS[size]
                : GRID_SPANS[size];
          return (
            <li
              key={index}
              className={`min-h-32 p-5 ${radius} ${TONES[tile.tone ?? "default"]} ${spans}`}
            >
              <TileContent tile={tile} bold={metro} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
