import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_FOR_MS = 5000;

/** A short message that clears itself, for confirming an action ("Copied") or explaining why it failed. */
export function useNotice() {
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(() => setNotice(""), SHOW_FOR_MS);
  }, []);

  return [notice, show] as const;
}
