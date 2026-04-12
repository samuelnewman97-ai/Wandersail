"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ActivityProposal } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { ActivityProposalCard } from "./ActivityProposalCard";

interface Props {
  messages: ChatMessage[];
  currency: string;
  onAcceptProposal: (messageId: string, toolCallId: string, proposal: ActivityProposal) => void;
  onRejectProposal: (messageId: string, toolCallId: string) => void;
}

export function MessageList({ messages, currency, onAcceptProposal, onRejectProposal }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="display text-2xl mb-2 text-teal-dark">Hello, traveler.</div>
          <p className="text-sm text-ink/70">
            Ask me what's worth doing in your destination, and I'll research hours, prices, and details, then
            drop ready-to-use activities right into your itinerary.
          </p>
          <div className="stamp text-[10px] text-ink/50 mt-4 leading-relaxed">
            Try: <br />
            <span className="italic">"What's there to do in Honolulu under $50?"</span>
            <br />
            <span className="italic">"Find me a great sushi spot near Waikiki."</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m}>
          {m.toolCalls?.map((tc) => {
            if (tc.name === "propose_activity") {
              const proposal = tc.input as ActivityProposal;
              const displayStatus: "pending_review" | "accepted" | "rejected" =
                tc.status === "accepted" || tc.status === "completed"
                  ? "accepted"
                  : tc.status === "rejected"
                    ? "rejected"
                    : "pending_review";
              return (
                <ActivityProposalCard
                  key={tc.id}
                  proposal={proposal}
                  status={displayStatus}
                  currency={currency}
                  onAccept={() => onAcceptProposal(m.id, tc.id, proposal)}
                  onRevise={() => onRejectProposal(m.id, tc.id)}
                />
              );
            }
            if (tc.name === "web_search") {
              return (
                <div
                  key={tc.id}
                  className="stamp text-[10px] text-teal-dark mt-2 flex items-center gap-1"
                >
                  <span className="inline-block w-1.5 h-1.5 bg-orange rounded-full animate-pulse" />
                  Searched the web
                  {(tc.input as { query?: string })?.query && (
                    <span className="italic">"{(tc.input as { query?: string }).query}"</span>
                  )}
                </div>
              );
            }
            return null;
          })}
        </MessageBubble>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
