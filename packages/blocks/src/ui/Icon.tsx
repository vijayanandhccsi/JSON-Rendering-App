import { Circle } from "lucide-react";
import { ICON_MAP } from "../icons/iconMap";
import type { IconName } from "../icons/iconNames";

/** Icon sizes from DESIGN.md: 16 inline, 20 default, 24 in card headings. */
export type IconSize = 16 | 20 | 24;

export const ICON_STROKE_WIDTH = 1.75;

interface IconProps {
  /** An icon from the curated set. Anything else shows a plain circle. */
  name: string;
  size?: IconSize;
  className?: string;
}

/** A Lucide icon by name. Decorative: always hidden from screen readers. */
export function Icon({ name, size = 20, className }: IconProps) {
  const Glyph = name in ICON_MAP ? ICON_MAP[name as IconName] : Circle;
  return <Glyph size={size} strokeWidth={ICON_STROKE_WIDTH} className={className} aria-hidden />;
}
