import type { ValidationIssue } from "@certkraft/blocks";
import type { Page } from "@certkraft/blocks";
import { useEffect, useMemo, useRef, useState } from "react";
import { toDiagnostics, issueRange } from "../editor/diagnostics";
import { Editor } from "../editor/Editor";
import type { EditorHandle } from "../editor/Editor";
import {
  MAX_UPLOAD_BYTES,
  downloadName,
  downloadText,
  formatJson,
  readFileText,
} from "../lib/files";
import { extractBriefs } from "../lib/briefs";
import { STORAGE_KEYS, readStored, removeStored, writeStored } from "../lib/storage";
import { ErrorPanel } from "../panels/ErrorPanel";
import { ImageChecklist } from "../panels/ImageChecklist";
import { PreviewPane } from "../panels/PreviewPane";
import samplePage from "../../../../fixtures/pages/valid/full-sample.json?raw";
import { DeviceToggle } from "../app/DeviceToggle";
import { EditorActions, Shell } from "../app/Header";
import { DEFAULT_MEDIA_BASE_URL, MediaUrlButton } from "../app/MediaUrlButton";
import { StatusChip } from "../app/StatusChip";
import { Workspace } from "../app/Workspace";
import { DEVICES, isDeviceId } from "../app/devices";
import type { DeviceId } from "../app/devices";
import { clampRatio } from "../app/Divider";
import { useNotice } from "../app/useNotice";
import { useStoredState } from "../app/useStoredState";
import { useValidation } from "../app/useValidation";

const AUTOSAVE_MS = 500;
const DEFAULT_RATIO = 50;

export default function EditorPage() {
  const [text, setText] = useState(() => readStored(STORAGE_KEYS.json) ?? "");
  const [deviceId, setDeviceId] = useStoredState(STORAGE_KEYS.device, "mobile");
  const [mediaBaseUrl, setMediaBaseUrl] = useStoredState(
    STORAGE_KEYS.media,
    DEFAULT_MEDIA_BASE_URL,
  );
  const [ratioText, setRatioText] = useStoredState(STORAGE_KEYS.split, String(DEFAULT_RATIO));
  const [pane, setPane] = useState<"json" | "preview">("json");
  const [notice, showNotice] = useNotice();
  const editor = useRef<EditorHandle>(null);

  const validation = useValidation(text);
  const { result, index, empty } = validation;
  // Buttons follow the text as it is right now. The checks below catch up a moment later.
  const hasText = text.trim() !== "";
  const settled = validation.text === text;
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0];
  const ratio = clampRatio(Number(ratioText) || DEFAULT_RATIO);

  // Remember the last valid page, so the preview keeps showing it while the text has errors.
  // Worked out while drawing, so the preview and the status chip always agree.
  const lastValidRef = useRef<Page | null>(null);
  if (validation.page) lastValidRef.current = validation.page;
  else if (validation.empty) lastValidRef.current = null;
  const lastValid = lastValidRef.current;

  // Autosave in this browser only. The JSON is never sent anywhere. It is saved a moment after typing
  // stops, and straight away if the page is left or closed first.
  const latestText = useRef(text);
  latestText.current = text;
  useEffect(() => {
    const save = () =>
      latestText.current === ""
        ? removeStored(STORAGE_KEYS.json)
        : writeStored(STORAGE_KEYS.json, latestText.current);
    const id = setTimeout(save, AUTOSAVE_MS);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);
  // Listen for JSON updates from Chat (generations, edits, undo/restores)
  useEffect(() => {
    const handleSetJson = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && typeof customEvent.detail === "string") {
        replaceText(customEvent.detail, "Updated page JSON from AI Chat.");
      }
    };
    window.addEventListener("certkraft:set-json", handleSetJson);
    return () => window.removeEventListener("certkraft:set-json", handleSetJson);
  }, []);

  const briefs = useMemo(() => extractBriefs(validation.text), [validation.text]);

  const diagnostics = useMemo(
    () => toDiagnostics(result, validation.text, index),
    [result, validation.text, index],
  );

  const replaceText = (next: string, message: string) => {
    setText(next);
    showNotice(message);
  };

  const onPaste = async () => {
    try {
      replaceText(
        await navigator.clipboard.readText(),
        "Pasted from the clipboard. Press Ctrl+Z in the editor to undo.",
      );
    } catch {
      showNotice(
        "Could not read the clipboard. Click in the editor and press Ctrl+V (Cmd+V on a Mac).",
      );
    }
  };

  const onUpload = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES)
      return showNotice("That file is too large. A page is a small .json file.");
    try {
      replaceText(await readFileText(file), `Loaded ${file.name}.`);
    } catch {
      showNotice(`Could not read ${file.name}.`);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice("Copied the JSON.");
    } catch {
      showNotice(
        "Could not copy to the clipboard. Select the text in the editor and press Ctrl+C.",
      );
    }
  };

  const onDownload = () => {
    if (!settled || !result.valid) return;
    downloadText(downloadName(text), formatJson(text) ?? text);
    showNotice("Downloaded the page.");
  };

  const onFormat = () => {
    const formatted = formatJson(text);
    if (formatted === null) {
      const problem = result.errors[0];
      return showNotice(
        `Cannot format yet: ${problem?.message ?? "the text is not valid JSON."} Fix it, then format.`,
      );
    }
    replaceText(formatted, "Formatted the JSON.");
  };

  const onSelectIssue = (issue: ValidationIssue) => {
    const range = issueRange(issue, validation.text, index);
    setPane("json");
    // The editor may be hidden on a narrow screen until its tab is shown.
    requestAnimationFrame(() => (range ? editor.current?.select(range) : editor.current?.focus()));
  };

  return (
    <Shell
      route="/"
      actions={
        <EditorActions
          hasText={hasText}
          canDownload={settled && result.valid && !empty}
          onPaste={onPaste}
          onUpload={onUpload}
          onCopy={onCopy}
          onDownload={onDownload}
          onFormat={onFormat}
          onSample={() => replaceText(samplePage, "Loaded the sample page.")}
          onClear={() => replaceText("", "Cleared the editor. Press Ctrl+Z in the editor to undo.")}
        />
      }
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-4 py-2">
        <StatusChip result={result} empty={empty} />
        <DeviceToggle
          value={isDeviceId(deviceId) ? deviceId : "mobile"}
          onChange={(id: DeviceId) => setDeviceId(id)}
        />
        <MediaUrlButton value={mediaBaseUrl} onSave={setMediaBaseUrl} />
        <p role="status" aria-live="polite" className="min-h-5 flex-1 text-small text-ink-muted">
          {notice}
        </p>
      </div>

      <Workspace
        ratio={ratio}
        onRatioChange={(next) => setRatioText(String(next))}
        pane={pane}
        onPaneChange={setPane}
        editor={
          <>
            <div className="min-h-0 flex-1">
              <Editor ref={editor} value={text} onChange={setText} diagnostics={diagnostics} />
            </div>
            {empty ? null : (
              <>
                <ErrorPanel result={result} onSelect={onSelectIssue} onNotice={showNotice} />
                <ImageChecklist briefs={briefs} mediaBaseUrl={mediaBaseUrl} onNotice={showNotice} />
              </>
            )}
          </>
        }
        preview={
          <PreviewPane
            page={lastValid}
            empty={empty}
            errorCount={result.errors.length}
            stale={!result.valid && lastValid !== null}
            width={device?.width ?? 390}
            mediaBaseUrl={mediaBaseUrl}
            onSample={() => replaceText(samplePage, "Loaded the sample page.")}
          />
        }
      />
    </Shell>
  );
}
