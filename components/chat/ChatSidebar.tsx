"use client";

import { useEffect, useState } from "react";
import { useStore, newTask, newDocument, newPackingItem } from "@/lib/store";
import type { Trip, ChatMessage, ChatToolCall, ActivityProposal } from "@/lib/types";
import {
  createClient,
  webSearchTool,
  proposeActivityTool,
  buildSystemPrompt,
  toAnthropicMessages,
} from "@/lib/anthropic";
import { proposalToActivity } from "@/lib/proposalToActivity";
import { uid } from "@/lib/utils";
import { MessageList } from "./MessageList";
import { ChatComposer } from "./ChatComposer";
import { X, Trash2, KeyRound } from "lucide-react";

interface Props {
  trip: Trip;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ trip, open, onClose }: Props) {
  const apiKey = useStore((s) => s.anthropicApiKey);
  const setApiKey = useStore((s) => s.setAnthropicApiKey);
  const chatModel = useStore((s) => s.chatModel);
  const setChatModel = useStore((s) => s.setChatModel);
  const thread = useStore((s) => s.chats[trip.id]);
  const appendMessage = useStore((s) => s.appendChatMessage);
  const updateMessage = useStore((s) => s.updateChatMessage);
  const updateToolCall = useStore((s) => s.updateChatToolCall);
  const clearChat = useStore((s) => s.clearChat);
  const upsertActivity = useStore((s) => s.upsertActivity);
  const upsertTask = useStore((s) => s.upsertTask);
  const upsertDoc = useStore((s) => s.upsertDocument);
  const upsertPacking = useStore((s) => s.upsertPacking);

  const [input, setInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const send = async () => {
    if (!apiKey || !input.trim() || sending) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
      status: "complete",
    };
    appendMessage(trip.id, userMsg);
    setInput("");

    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
      createdAt: new Date().toISOString(),
      status: "streaming",
    };
    appendMessage(trip.id, assistantMsg);

    setSending(true);

    try {
      const client = createClient(apiKey);
      const historyForApi = [
        ...(thread?.messages ?? []),
        userMsg,
      ];

      let accumulated = "";
      const liveToolCalls: ChatToolCall[] = [];

      // We may need multiple "turns" if Claude calls web_search mid-thought —
      // the SDK's stream handles all server-side tool calls (web_search) within
      // a single message.create if we pass them. Custom tools (propose_activity)
      // end the turn; we pick it up on the next user send.
      const stream = client.messages.stream({
        model: chatModel,
        max_tokens: 4096,
        system: buildSystemPrompt(trip),
        tools: [webSearchTool, proposeActivityTool] as unknown as Parameters<
          typeof client.messages.stream
        >[0]["tools"],
        messages: toAnthropicMessages(historyForApi),
      });

      stream.on("text", (delta) => {
        accumulated += delta;
        updateMessage(trip.id, assistantId, { content: accumulated });
      });

      stream.on("inputJson", () => {
        // tool input streaming — we'll capture the final block on contentBlock
      });

      stream.on("contentBlock", (block) => {
        if (block.type === "tool_use") {
          const tc: ChatToolCall = {
            id: block.id,
            name: block.name,
            input: block.input,
            status: block.name === "propose_activity" ? "pending_review" : "completed",
          };
          liveToolCalls.push(tc);
          updateMessage(trip.id, assistantId, { toolCalls: [...liveToolCalls] });
        }
      });

      const final = await stream.finalMessage();
      updateMessage(trip.id, assistantId, {
        status: "complete",
        content: accumulated || extractText(final.content),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      updateMessage(trip.id, assistantId, { status: "error", error: message });
    } finally {
      setSending(false);
    }
  };

  const acceptProposal = (messageId: string, toolCallId: string, proposal: ActivityProposal) => {
    const { activity, tasks, documents, packing } = proposalToActivity(proposal);
    upsertActivity(trip.id, activity);
    tasks.forEach((t) => upsertTask(trip.id, newTask(t.label, t.dueDate, activity.id)));
    documents.forEach((d) => upsertDoc(trip.id, newDocument(d.label, d.url, activity.id)));
    packing.forEach((p) =>
      upsertPacking(trip.id, newPackingItem(p.label, p.category ?? "Activity", activity.id))
    );
    updateToolCall(trip.id, messageId, toolCallId, {
      status: "accepted",
      result: { activity_id: activity.id },
    });
  };

  const rejectProposal = (messageId: string, toolCallId: string) => {
    updateToolCall(trip.id, messageId, toolCallId, { status: "rejected" });
  };

  if (!open) return null;

  const noKey = !apiKey;

  return (
    <aside
      className="w-[360px] xl:w-[420px] shrink-0 bg-cream border-l-4 border-ink flex flex-col sticky top-0 self-start"
      style={{ height: "100vh" }}
    >
        <header className="border-b-2 border-ink bg-cream">
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="stamp text-[10px] text-orange leading-none mb-1">
                — Claude · Trip co-planner —
              </div>
              <div className="display text-lg leading-none truncate">{trip.name}</div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 border-2 border-ink hover:bg-cream-dark bg-cream"
              aria-label="Close"
              title="Close (Ctrl+K)"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-3 pb-3 flex items-center gap-2">
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="field-input text-xs py-1 flex-1"
              title="Model"
            >
              <option value="claude-sonnet-4-6">Sonnet 4.6</option>
              <option value="claude-opus-4-6">Opus 4.6</option>
              <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
            </select>
            <button
              onClick={() => {
                if (confirm("Clear the chat thread for this trip?")) clearChat(trip.id);
              }}
              className="shrink-0 p-1.5 border-2 border-ink hover:bg-cream-dark bg-cream flex items-center gap-1 stamp text-[10px]"
              aria-label="Clear thread"
              title="Clear thread"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </header>

        {noKey ? (
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="border-2 border-ink p-4 bg-cream" style={{ boxShadow: "4px 4px 0 var(--orange)" }}>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={16} className="text-orange" />
                <h3 className="display text-xl">Paste your Claude API key</h3>
              </div>
              <p className="text-xs text-ink/70 mb-3">
                Claude needs an Anthropic API key to help you plan. It's saved to this browser only.
              </p>
              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="field-input font-mono text-xs mb-2"
                type="password"
                spellCheck={false}
              />
              <button
                onClick={() => {
                  if (keyInput.trim()) {
                    setApiKey(keyInput.trim());
                    setKeyInput("");
                  }
                }}
                disabled={!keyInput.trim()}
                className="btn-poster btn-poster-sm disabled:opacity-40"
              >
                Save key
              </button>
              <div className="stamp text-[10px] text-teal-dark mt-3">
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-orange"
                >
                  Get a key →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={thread?.messages ?? []}
              currency={trip.currency}
              onAcceptProposal={acceptProposal}
              onRejectProposal={rejectProposal}
            />
            {error && (
              <div className="px-3 pb-2 stamp text-[10px] text-orange">⚠ {error}</div>
            )}
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={send}
              disabled={sending}
              placeholder={sending ? "Claude is thinking…" : undefined}
            />
          </>
        )}
    </aside>
  );
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  let out = "";
  for (const block of content as { type: string; text?: string }[]) {
    if (block.type === "text" && block.text) out += block.text;
  }
  return out;
}
