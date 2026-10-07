import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const DEFAULT_MEDIA_BASE_URL = "/media/";

const MediaContext = createContext(DEFAULT_MEDIA_BASE_URL);

export function MediaProvider({ baseUrl, children }: { baseUrl: string; children: ReactNode }) {
  return <MediaContext.Provider value={baseUrl}>{children}</MediaContext.Provider>;
}

/** Turns an image file name into a URL under the media base URL. */
export function useMediaUrl(): (file: string) => string {
  const baseUrl = useContext(MediaContext);
  return (file) => `${baseUrl.endsWith("/") || baseUrl === "" ? baseUrl : `${baseUrl}/`}${file}`;
}
