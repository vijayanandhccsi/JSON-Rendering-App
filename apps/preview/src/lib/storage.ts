/** localStorage that never throws: it can be blocked or full, and the app must work without it. */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not saved: the page still works, it just will not survive a refresh.
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}

export const STORAGE_KEYS = {
  json: "certkraft-preview:v1:json",
  media: "certkraft-preview:v1:media-base-url",
  device: "certkraft-preview:v1:device",
  split: "certkraft-preview:v1:split",
} as const;
