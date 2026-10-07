import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";
import { Picture } from "./Image";

const NAV_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-pill border border-border bg-surface text-ink transition-colors duration-150 ease-out hover:bg-bg disabled:cursor-not-allowed disabled:text-ink-muted disabled:opacity-60";

export function Carousel({ block }: { block: BlockOf<"carousel"> }) {
  const reducedMotion = usePrefersReducedMotion();
  const [viewport, embla] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const count = block.slides.length;

  useEffect(() => {
    if (!embla) return;
    const update = () => setSelected(embla.selectedScrollSnap());
    update();
    embla.on("select", update).on("reInit", update);
    return () => {
      embla.off("select", update).off("reInit", update);
    };
  }, [embla]);

  // With reduced motion, jump straight to the slide instead of sliding.
  const goTo = useCallback(
    (index: number) => embla?.scrollTo(index, reducedMotion),
    [embla, reducedMotion],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") goTo(Math.max(selected - 1, 0));
    else if (event.key === "ArrowRight") goTo(Math.min(selected + 1, count - 1));
    else return;
    event.preventDefault();
  };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Slides"
      onKeyDown={onKeyDown}
      className="rounded-card"
    >
      <div ref={viewport} className="overflow-hidden rounded-card">
        <div className="flex">
          {block.slides.map((slide, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${count}`}
              aria-hidden={index !== selected}
              inert={index !== selected}
              className="min-w-0 shrink-0 grow-0 basis-full pr-4"
            >
              <div className="h-full rounded-card border border-border bg-surface p-5">
                {slide.title ? (
                  <p className="mb-2 text-h4 font-semibold">
                    <InlineText text={slide.title} />
                  </p>
                ) : null}
                {slide.image ? (
                  <div className="mb-4">
                    <Picture
                      src={slide.image.src}
                      alt={slide.image.alt}
                      description={slide.image.description}
                    />
                  </div>
                ) : null}
                {slide.text ? (
                  <p>
                    <InlineText text={slide.text} />
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          className={NAV_BUTTON}
          aria-label="Previous slide"
          disabled={selected === 0}
          onClick={() => goTo(selected - 1)}
        >
          <ChevronLeft size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </button>
        <div className="flex flex-wrap items-center justify-center">
          {block.slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className="group flex size-11 items-center justify-center rounded-pill"
            >
              <span
                aria-hidden
                className={`block size-2.5 rounded-pill transition-colors duration-150 ease-out ${index === selected ? "bg-primary" : "bg-border group-hover:bg-ink-muted"}`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={NAV_BUTTON}
          aria-label="Next slide"
          disabled={selected === count - 1}
          onClick={() => goTo(selected + 1)}
        >
          <ChevronRight size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </button>
      </div>
      <p role="status" className="sr-only">
        Slide {selected + 1} of {count}
      </p>
    </section>
  );
}
