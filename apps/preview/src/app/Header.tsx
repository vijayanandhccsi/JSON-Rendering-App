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
import { Link, ROUTES } from "./Router";
import type { RoutePath } from "./Router";

/** The 56 px bar: app name, the three pages, and (on the editor page) the editor's actions. */
export function Header({ route, actions }: { route: RoutePath | null; actions?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex min-w-0 items-center gap-6">
        <span className="truncate text-h4 font-semibold">CertKraft page preview</span>
        <nav aria-label="Pages" className="flex items-center gap-1">
          {ROUTES.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              aria-current={route === path ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-control px-3 text-small font-medium transition-colors duration-150 ease-out ${
                route === path ? "bg-bg text-ink" : "text-ink-muted hover:bg-bg hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {actions}
    </header>
  );
}

/** The page layout: header on top, content below. */
export function Shell({
  route,
  actions,
  children,
}: {
  route: RoutePath | null;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-bg font-sans text-ink">
      <Header route={route} actions={actions} />
      {children}
    </div>
  );
}

interface EditorActionsProps {
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

export function EditorActions({
  hasText,
  canDownload,
  onPaste,
  onUpload,
  onCopy,
  onDownload,
  onFormat,
  onSample,
  onClear,
}: EditorActionsProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so choosing the same file again still loads it
    if (file) onUpload(file);
  };

  return (
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
          canDownload ? "Download the page as a JSON file" : "Fix every error to download the page"
        }
      />
      <Action label="Format" icon={icon(WandSparkles)} onClick={onFormat} disabled={!hasText} />
      <Action label="Sample" icon={icon(FileText)} onClick={onSample} />
      <Action label="Clear" icon={icon(Eraser)} onClick={onClear} disabled={!hasText} />
    </div>
  );
}
