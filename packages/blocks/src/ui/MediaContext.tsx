import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const DEFAULT_MEDIA_BASE_URL = "/media/";

const MediaContext = createContext(DEFAULT_MEDIA_BASE_URL);

export function MediaProvider({ baseUrl, children }: { baseUrl: string; children: ReactNode }) {
  return <MediaContext.Provider value={baseUrl}>{children}</MediaContext.Provider>;
}

/** The address of an image file under a media base URL such as "/media/" or "https://cdn.example.com/media". */
export function mediaUrl(baseUrl: string, file: string): string {
  return `${baseUrl.endsWith("/") || baseUrl === "" ? baseUrl : `${baseUrl}/`}${file}`;
}

/** Turns an image file name into a URL under the media base URL. */
export function useMediaUrl(): (file: string) => string {
  const baseUrl = useContext(MediaContext);
  return (file) => mediaUrl(baseUrl, file);
}
