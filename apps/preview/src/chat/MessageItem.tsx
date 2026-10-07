import { AlertCircle, CheckCircle2, Check, Copy, FileText, Sparkles, User } from "lucide-react";
import { useState } from "react";

export interface MessageItemProps {
  message: {
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    attachment_name?: string | null;
    tokens_in?: number;
    tokens_out?: number;
    jsonVersion?: {
      versionId?: string;
      versionNo?: number;
      valid: boolean;
      errors?: { path?: string; message: string }[];
      parsedJson?: unknown;
      isPatch?: boolean;
      patchFailed?: boolean;
      isOutline?: boolean;
      outlinePayload?: any;
    };
  };
  onApproveOutline?: (outline: any) => void;
}

export function MessageItem({ message, onApproveOutline }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const isUser = message.role === "user";
  const { jsonVersion } = message;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 text-small ${
        isUser ? "flex-row-reverse" : "flex-row"
      } group`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
          isUser
            ? "bg-ink text-surface"
            : "bg-surface border border-border text-ink"
        }`}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} className="text-amber-500" />}
      </div>

      {/* Message Bubble Container */}
      <div className={`flex max-w-[85%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`relative rounded-2xl px-4 py-2.5 leading-relaxed ${
            isUser
              ? "bg-ink text-surface rounded-tr-none"
              : "bg-surface border border-border text-ink rounded-tl-none shadow-xs"
          }`}
        >
          {/* Main Content */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Validation Status Badge if JSON version exists */}
          {jsonVersion && (
            <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    jsonVersion.valid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {jsonVersion.valid ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Valid JSON (v{jsonVersion.versionNo})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} />
                      <span>
                        Invalid JSON ({jsonVersion.errors?.length || 1} errors)
                      </span>
                    </>
                  )}
                </div>

                {!jsonVersion.valid && jsonVersion.errors && jsonVersion.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowErrors((prev) => !prev)}
                    className="text-xs text-red-600 underline hover:text-red-800"
                  >
                    {showErrors ? "Hide errors" : "View errors"}
                  </button>
                )}
              </div>

              {/* Expandable validation error list */}
              {showErrors && jsonVersion.errors && (
                <ul className="mt-1.5 space-y-1 text-xs text-red-700 bg-red-50/80 p-2 rounded-lg border border-red-100">
                  {jsonVersion.errors.map((err, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="font-semibold shrink-0">[{err.path || "root"}]:</span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Outline Card if response contains outline structure */}
          {jsonVersion?.outlinePayload && (
            <div className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50/80 text-ink">
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-900 mb-1">
                <FileText size={14} className="text-amber-600" />
                <span>Proposed Page Outline ({jsonVersion.outlinePayload.sections?.length || 0} sections)</span>
              </div>
              <div className="text-xs font-bold text-amber-950 mb-1">{jsonVersion.outlinePayload.title}</div>
              <div className="text-xs text-amber-800 mb-2">{jsonVersion.outlinePayload.summary}</div>
              <ol className="space-y-1 mb-3 text-xs list-decimal list-inside text-amber-900">
                {jsonVersion.outlinePayload.sections?.map((sec: any, idx: number) => (
                  <li key={idx} className="font-medium">
                    {sec.title}
                    {sec.plannedBlocks && (
                      <span className="ml-2 font-normal text-amber-700 text-[10px]">
                        ({sec.plannedBlocks.join(", ")})
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {onApproveOutline && (
                <button
                  type="button"
                  onClick={() => onApproveOutline(jsonVersion.outlinePayload)}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Approve & Generate Section by Section</span>
                </button>
              )}
            </div>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy message"
            className={`absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
              isUser
                ? "bg-ink/40 text-surface hover:bg-ink/60"
                : "bg-bg text-ink-muted hover:bg-border hover:text-ink"
            }`}
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Attachment badge */}
        {message.attachment_name && (
          <span className="text-xs text-ink-muted">
            Attached: {message.attachment_name}
          </span>
        )}
      </div>
    </div>
  );
}
