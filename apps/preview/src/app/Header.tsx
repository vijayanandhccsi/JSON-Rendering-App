import {
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  FileText,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { CHROME_BUTTON, CHROME_PRIMARY_BUTTON } from "./buttons";

interface HeaderProps {
  hasText: boolean;
  canDownload: boolean;
  onPaste: () => void;
  onUpload: (file: File) => void;
  onCopy: () => void;
  onDownload: () => void;
  onFormat: () => void;
  onSample: () => void;
  onClear: () => void;
}

interface ActionProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  hint?: string;
}

/** Icon and text; below the xl breakpoint only the icon shows (the name stays for screen readers and as a tooltip). */
function Action({ label, icon, onClick, disabled, primary, hint }: ActionProps) {
  return (
    <button
      type="button"
      className={primary ? CHROME_PRIMARY_BUTTON : CHROME_BUTTON}
      onClick={onClick}
      disabled={disabled}
      title={hint ?? label}
    >
      {icon}
      <span className="sr-only xl:not-sr-only">{label}</span>
    </button>
  );
}

const icon = (Glyph: typeof Copy) => <Glyph size={20} strokeWidth={1.75} aria-hidden />;

export function Header({
  hasText,
  canDownload,
  onPaste,
  onUpload,
  onCopy,
  onDownload,
  onFormat,
  onSample,
  onClear,
}: HeaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so choosing the same file again still loads it
    if (file) onUpload(file);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <span className="truncate text-h4 font-semibold">CertKraft page preview</span>
      <div role="toolbar" aria-label="Actions" className="flex items-center gap-1 overflow-x-auto">
        <Action label="Paste" icon={icon(ClipboardPaste)} onClick={onPaste} />
        <Action label="Upload" icon={icon(Upload)} onClick={() => fileInput.current?.click()} />
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={onFile}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
        <Action label="Copy" icon={icon(Copy)} onClick={onCopy} disabled={!hasText} />
        <Action
          label="Download"
          icon={icon(Download)}
          onClick={onDownload}
          disabled={!canDownload}
          primary
          hint={
            canDownload
              ? "Download the page as a JSON file"
              : "Fix every error to download the page"
          }
        />
        <Action label="Format" icon={icon(WandSparkles)} onClick={onFormat} disabled={!hasText} />
        <Action label="Sample" icon={icon(FileText)} onClick={onSample} />
        <Action label="Clear" icon={icon(Eraser)} onClick={onClear} disabled={!hasText} />
      </div>
    </header>
  );
}
