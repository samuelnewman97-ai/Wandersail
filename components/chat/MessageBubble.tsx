"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
  children?: React.ReactNode;
}

export function MessageBubble({ message, children }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] border-2 border-ink px-3 py-2 text-sm ${
          isUser ? "bg-teal text-cream" : "bg-cream text-ink"
        }`}
        style={{
          boxShadow: isUser ? "3px 3px 0 var(--ink)" : "3px 3px 0 var(--orange)",
        }}
      >
        {message.content && (
          <div className="prose-chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.status === "streaming" && (
          <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" aria-label="typing" />
        )}
        {message.error && (
          <div className="stamp text-[10px] text-orange mt-1">⚠ {message.error}</div>
        )}
        {children}
      </div>
    </div>
  );
}
