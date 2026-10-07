import { Image } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { CHROME_BUTTON } from "./buttons";

export const DEFAULT_MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL ?? "/media/";

/** A relative folder such as /media/ or a full http(s) address. Returns a message when it is not one. */
export function checkMediaBaseUrl(value: string): string | null {
  const text = value.trim();
  if (text === "")
    return "Enter a folder such as /media/ or a full address such as https://example.com/media/.";
  if (/^https?:\/\/\S+$/i.test(text) || /^\/[^\s]*$/.test(text)) return null;
  return "Start with / for a folder on this site, or with http:// or https:// for another site.";
}

interface MediaUrlButtonProps {
  value: string;
  onSave: (value: string) => void;
}

export function MediaUrlButton({ value, onSave }: MediaUrlButtonProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [problem, setProblem] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const openPanel = () => {
    setDraft(value);
    setProblem(null);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = checkMediaBaseUrl(draft);
    if (message) return setProblem(message);
    onSave(draft.trim());
    close();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  };

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={CHROME_BUTTON}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => (open ? close() : openPanel())}
      >
        <Image size={16} strokeWidth={1.75} aria-hidden />
        <span>
          Media folder<span className="sr-only">: {value}</span>
        </span>
      </button>
      {open ? (
        <form
          id={`${id}-panel`}
          role="dialog"
          aria-label="Media folder"
          onSubmit={submit}
          className="absolute right-0 top-full z-30 mt-2 flex w-80 flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-raised"
        >
          <label htmlFor={`${id}-input`} className="text-small font-medium">
            Where the image files are
          </label>
          <input
            ref={input}
            id={`${id}-input`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={problem !== null}
            aria-describedby={`${id}-help`}
            spellCheck={false}
            className="min-h-11 rounded-control border border-border bg-surface px-3 font-mono text-small"
          />
          <p id={`${id}-help`} className="text-caption text-ink-muted">
            Image file names in the JSON are added to this address. The default is{" "}
            {DEFAULT_MEDIA_BASE_URL}.
          </p>
          {problem ? (
            <p role="alert" className="text-small text-danger">
              {problem}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={CHROME_BUTTON}
              onClick={() => setDraft(DEFAULT_MEDIA_BASE_URL)}
            >
              Use default
            </button>
            <button type="button" className={CHROME_BUTTON} onClick={close}>
              Cancel
            </button>
            <button type="submit" className={CHROME_BUTTON}>
              Save
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
