import { mediaUrl } from "@certkraft/blocks";
import { useCallback, useEffect, useState } from "react";

export type ImageState = "checking" | "found" | "missing";

/**
 * Whether each image file can be loaded from the media folder. It loads each image the way a page would,
 * so it works for any media address, and it only fetches the image files, never the page JSON.
 */
export function useImageStatus(baseUrl: string, files: readonly string[]) {
  const [status, setStatus] = useState<Record<string, ImageState>>({});
  const [round, setRound] = useState(0);
  const key = files.join("\n");

  useEffect(() => {
    let cancelled = false;
    const list = key === "" ? [] : key.split("\n");
    setStatus(Object.fromEntries(list.map((file) => [file, "checking" as const])));

    const images = list.map((file) => {
      const image = new Image();
      const finish = (state: ImageState) => {
        if (!cancelled) setStatus((current) => ({ ...current, [file]: state }));
      };
      image.onload = () => finish("found");
      image.onerror = () => finish("missing");
      image.src = mediaUrl(baseUrl, file);
      return image;
    });

    return () => {
      cancelled = true;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [baseUrl, key, round]);

  const recheck = useCallback(() => setRound((value) => value + 1), []);
  return { status, recheck };
}
