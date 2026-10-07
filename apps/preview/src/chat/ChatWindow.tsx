import {
  Bot,
  ChevronDown,
  FileText,
  History,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from "react";
import { MessageItem } from "./MessageItem";

export interface PageInfo {
  id: string;
  title: string;
  created_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export interface VersionInfo {
  id: string;
  page_id: string;
  version_no: number;
  json: string;
  valid: number;
  errors?: string | null;
  created_at: string;
}

export interface MessageData {
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
  };
}

interface AttachedFile {
  name: string;
  text: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [currentVersionNo, setCurrentVersionNo] = useState<number | null>(null);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const [isDragOver, setIsDragOver] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load models & pages on mount
  useEffect(() => {
    if (!isOpen) return;

    fetchModels();
    fetchPages();
  }, [isOpen]);

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        const modelList: ModelInfo[] = data.models || [];
        setModels(modelList);
        if (modelList.length > 0 && !selectedModel) {
          const firstModel = modelList[0];
          if (firstModel) {
            setSelectedModel(firstModel.id);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        const pageList: PageInfo[] = data.pages || [];
        setPages(pageList);

        const savedPageId = localStorage.getItem("certkraft_last_page_id");
        if (savedPageId && pageList.some((p) => p.id === savedPageId)) {
          loadPage(savedPageId);
        } else if (pageList.length > 0 && pageList[0]) {
          loadPage(pageList[0].id);
        } else {
          handleCreatePage();
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchVersions = async (pageId: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/versions`);
      if (res.ok) {
        const data = await res.json();
        const vList: VersionInfo[] = data.versions || [];
        setVersions(vList);

        const currentV = vList.find((v) => v.id === data.currentVersionId);
        if (currentV) {
          setCurrentVersionNo(currentV.version_no);
        } else if (vList.length > 0 && vList[0]) {
          setCurrentVersionNo(vList[0].version_no);
        } else {
          setCurrentVersionNo(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadPage = async (pageId: string) => {
    setSelectedPageId(pageId);
    localStorage.setItem("certkraft_last_page_id", pageId);

    try {
      const res = await fetch(`/api/pages/${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.chat?.model) {
          setSelectedModel(data.chat.model);
        }
        if (data.currentJson) {
          const jsonStr = typeof data.currentJson === "string"
            ? data.currentJson
            : JSON.stringify(data.currentJson, null, 2);
          window.dispatchEvent(new CustomEvent("certkraft:set-json", { detail: jsonStr }));
        }
      }
    } catch {
      // ignore
    }

    fetchVersions(pageId);
  };

  const handleCreatePage = async () => {
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `New Page ${pages.length + 1}`,
          model: selectedModel || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPages((prev) => [data.page, ...prev]);
        setSelectedPageId(data.page.id);
        localStorage.setItem("certkraft_last_page_id", data.page.id);
        setMessages([]);
        setVersions([]);
        setCurrentVersionNo(null);
        if (data.chat?.model) {
          setSelectedModel(data.chat.model);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    if (selectedPageId) {
      try {
        await fetch(`/api/pages/${selectedPageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: newModel }),
        });
      } catch {
        // ignore
      }
    }
  };

  const handleRestoreVersion = async (versionNo: number) => {
    if (!selectedPageId) return;

    try {
      const res = await fetch(`/api/pages/${selectedPageId}/restore/${versionNo}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentVersionNo(versionNo);
        if (data.currentJson) {
          const jsonStr = typeof data.currentJson === "string"
            ? data.currentJson
            : JSON.stringify(data.currentJson, null, 2);
          window.dispatchEvent(new CustomEvent("certkraft:set-json", { detail: jsonStr }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    if (!currentVersionNo || currentVersionNo <= 1) return;
    handleRestoreVersion(currentVersionNo - 1);
  };

  const uploadFileToServer = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setAttachedFile({
          name: data.filename,
          text: data.text,
        });
      } else {
        setUploadError(data.error || "Failed to upload file");
      }
    } catch {
      setUploadError("Network error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      uploadFileToServer(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFileToServer(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const trimmedInput = inputText.trim();
    if ((!trimmedInput && !attachedFile) || isStreaming || !selectedPageId) return;

    let fullMessageContent = trimmedInput;
    if (attachedFile) {
      fullMessageContent += `\n\n--- Attachment: ${attachedFile.name} ---\n${attachedFile.text}`;
    }

    const userMessage: MessageData = {
      role: "user",
      content: fullMessageContent,
      attachment_name: attachedFile?.name || null,
    };

    const attachmentNameParam = attachedFile?.name;

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setAttachedFile(null);
    setUploadError(null);
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedPageId,
          message: fullMessageContent,
          model: selectedModel,
          attachmentName: attachmentNameParam,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errData.error || "Failed to stream"}` },
        ]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.type === "chunk" && data.text) {
                  accumulated += data.text;
                  setStreamingText(accumulated);
                } else if (data.type === "done") {
                  const assistantMsg: MessageData = {
                    id: data.messageId,
                    role: "assistant",
                    content: accumulated,
                    tokens_in: data.tokensIn,
                    tokens_out: data.tokensOut,
                    jsonVersion: data.jsonVersion,
                  };

                  setMessages((prev) => [...prev, assistantMsg]);
                  setStreamingText("");

                  if (data.jsonVersion?.valid && data.jsonVersion?.parsedJson) {
                    const jsonStr = JSON.stringify(data.jsonVersion.parsedJson, null, 2);
                    window.dispatchEvent(new CustomEvent("certkraft:set-json", { detail: jsonStr }));
                    if (selectedPageId) fetchVersions(selectedPageId);
                  }
                } else if (data.type === "error") {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `Error: ${data.error}` },
                  ]);
                  setStreamingText("");
                }
              } catch {
                // parse error
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error sending message. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Dragging window handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("select, button, input, textarea")) return;
    setIsDraggingWindow(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWindow) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
    };

    if (isDraggingWindow) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingWindow]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`fixed bottom-20 right-6 z-50 flex h-[640px] w-[480px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border bg-surface shadow-2xl transition-all duration-200 ${
        isDragOver ? "border-amber-500 ring-2 ring-amber-500/20" : "border-border"
      }`}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-surface/95 backdrop-blur-xs text-ink">
          <Paperclip size={36} className="text-amber-500 animate-bounce mb-2" />
          <p className="font-semibold text-medium">Drop file to attach</p>
          <p className="text-xs text-ink-muted mt-1">Supports .json, .md, .txt (max 1MB)</p>
        </div>
      )}

      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex h-14 shrink-0 cursor-grab items-center justify-between gap-2 border-b border-border px-4 select-none active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={18} className="text-amber-500 shrink-0" />

          {/* Page Switcher */}
          <div className="relative flex items-center min-w-0">
            <select
              value={selectedPageId || ""}
              onChange={(e) => {
                if (e.target.value === "__NEW__") {
                  handleCreatePage();
                } else {
                  loadPage(e.target.value);
                }
              }}
              className="appearance-none max-w-[150px] truncate rounded-control border border-border bg-bg py-1 pl-2.5 pr-7 text-xs font-semibold text-ink outline-none hover:border-ink focus:border-ink cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
              <option value="__NEW__">+ New Page</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-muted" />
          </div>

          {/* Model Selector */}
          <div className="relative flex items-center min-w-0">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="appearance-none max-w-[130px] truncate rounded-control border border-border bg-bg py-1 pl-2.5 pr-7 text-xs font-medium text-ink outline-none hover:border-ink focus:border-ink cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-muted" />
          </div>
        </div>

        {/* Header Actions (Version Selector, Undo, Close) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {versions.length > 0 && (
            <>
              {/* Undo Button */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={!currentVersionNo || currentVersionNo <= 1}
                title="Undo to previous version"
                className="flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-bg hover:text-ink disabled:opacity-30"
              >
                <RotateCcw size={15} />
              </button>

              {/* Version Selector */}
              <div className="relative flex items-center">
                <select
                  value={currentVersionNo || ""}
                  onChange={(e) => handleRestoreVersion(Number(e.target.value))}
                  className="appearance-none rounded-control border border-border bg-bg py-1 pl-2 pr-6 text-xs font-medium text-ink outline-none hover:border-ink focus:border-ink cursor-pointer"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_no}>
                      v{v.version_no} {v.valid ? "" : "(invalid)"}
                    </option>
                  ))}
                </select>
                <History size={12} className="pointer-events-none absolute right-1.5 text-ink-muted" />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-bg hover:text-ink ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming && (
          <div className="my-auto flex flex-col items-center justify-center gap-2 text-center text-ink-muted">
            <Bot size={36} strokeWidth={1.5} />
            <p className="text-small font-medium">Ask AI to generate or edit lesson JSON</p>
            <p className="text-xs text-ink-muted">Paste outline, type instructions, or attach a file</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageItem key={msg.id || index} message={msg} />
        ))}

        {/* Streaming text feedback */}
        {isStreaming && streamingText && (
          <MessageItem
            message={{
              role: "assistant",
              content: streamingText,
            }}
          />
        )}

        {/* Streaming indicator when waiting for first token */}
        {isStreaming && !streamingText && (
          <div className="flex items-center gap-2 text-xs text-ink-muted pl-9">
            <Loader2 size={14} className="animate-spin text-amber-500" />
            <span>Generating page JSON...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mx-3 mb-1 flex items-center justify-between rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 border border-red-200">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-2 hover:opacity-75"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Attached File Chip */}
      {attachedFile && (
        <div className="mx-3 mb-1 flex items-center justify-between rounded-lg bg-bg px-3 py-1.5 text-xs border border-border">
          <div className="flex items-center gap-2 truncate">
            <FileText size={14} className="text-amber-500 shrink-0" />
            <span className="truncate font-medium text-ink">{attachedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="ml-2 text-ink-muted hover:text-ink"
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.md,.txt"
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="relative flex items-end rounded-xl border border-border bg-bg px-3 py-2 transition-within focus-within:border-ink">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isStreaming}
            title="Attach file (.json, .md, .txt)"
            className="mb-1 mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            {uploading ? (
              <Loader2 size={15} className="animate-spin text-amber-500" />
            ) : (
              <Paperclip size={15} />
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to generate page JSON or attach a file..."
            className="max-h-32 min-h-[40px] w-full resize-none bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedFile) || isStreaming || uploading}
            title="Send message"
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-ink text-surface transition hover:opacity-90 disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
