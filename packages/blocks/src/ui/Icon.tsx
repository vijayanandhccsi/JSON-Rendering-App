import { Circle } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import type { IconName } from "lucide-react/dynamic";
import { LUCIDE_ICON_NAMES } from "../validate/icons";

/** Icon sizes from DESIGN.md: 16 inline, 20 default, 24 in card headings. */
export type IconSize = 16 | 20 | 24;

export const ICON_STROKE_WIDTH = 1.75;

interface IconProps {
  /** A Lucide icon name in kebab-case. Unknown names show a plain circle. */
  name: string;
  size?: IconSize;
  className?: string;
}

/** Loads a Lucide icon by name, only when it is used. Decorative: always hidden from screen readers. */
export function Icon({ name, size = 20, className }: IconProps) {
  if (!LUCIDE_ICON_NAMES.has(name)) {
    return <Circle size={size} strokeWidth={ICON_STROKE_WIDTH} className={className} aria-hidden />;
  }
  return (
    <DynamicIcon
      name={name as IconName}
      size={size}
      strokeWidth={ICON_STROKE_WIDTH}
      className={className}
      aria-hidden
      fallback={() => (
        <span
          aria-hidden
          className={`inline-block shrink-0 ${className ?? ""}`}
          style={{ width: size, height: size }}
        />
      )}
    />
  );
}
