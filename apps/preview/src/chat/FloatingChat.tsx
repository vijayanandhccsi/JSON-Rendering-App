import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { ChatWindow } from "./ChatWindow";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating launcher button at bottom-right */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? "Close AI Chat" : "Open AI Chat"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-surface shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <Sparkles size={24} className="text-amber-400" />
        )}
      </button>

      {/* Floating Chat Window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
