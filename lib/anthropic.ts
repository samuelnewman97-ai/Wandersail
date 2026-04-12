"use client";

import Anthropic from "@anthropic-ai/sdk";
import type { Trip } from "./types";
import { compareDateTime, fmtDayHeader } from "./date";

export function createClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

// -------------------------- Tools --------------------------

// Built-in web search tool (Claude runs the search itself and returns results).
// See: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-search-tool
export const webSearchTool = {
  type: "web_search_20250305" as const,
  name: "web_search",
  max_uses: 6,
};

export const proposeActivityTool = {
  name: "propose_activity",
  description:
    "Propose a fully-formed activity for the user's itinerary. Only call this AFTER you've researched all the required details via web_search — opening hours, cost, address, coordinates, etc. After calling, STOP generating and wait for the user to accept or revise.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short, specific activity title." },
      description: {
        type: "string",
        description: "1-2 sentence description of the activity.",
      },
      category: {
        type: "string",
        enum: ["Lodging", "Food", "Activities", "Transport", "Shopping", "Other"],
      },
      cost_per_person: {
        type: "number",
        description: "Cost per person in the trip's currency. Use 0 if free.",
      },
      currency: { type: "string", description: "Currency code, e.g. USD." },
      location: {
        type: "object",
        properties: {
          label: { type: "string", description: "Human-readable address or place name." },
          lat: { type: "number", description: "Latitude (signed, negative for south)." },
          lng: { type: "number", description: "Longitude (signed, negative for west)." },
        },
        required: ["label"],
      },
      date: { type: "string", description: "YYYY-MM-DD" },
      start_time: { type: "string", description: "HH:mm 24-hour" },
      end_time: { type: "string", description: "HH:mm 24-hour" },
      typical_duration_minutes: {
        type: "number",
        description: "Typical visit duration in minutes.",
      },
      links: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            url: { type: "string" },
          },
          required: ["label", "url"],
        },
      },
      linked_tasks: {
        type: "array",
        description:
          "Planning tasks the user needs to do BEFORE/DURING this activity (e.g., 'Book timed entry tickets', 'Make dinner reservation').",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            due_date: { type: "string", description: "YYYY-MM-DD" },
          },
          required: ["label"],
        },
      },
      linked_documents: {
        type: "array",
        description: "Relevant URLs to save with the activity (reservation confirmations, etc.).",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            url: { type: "string" },
          },
          required: ["label", "url"],
        },
      },
      linked_packing: {
        type: "array",
        description:
          "Items the user should pack specifically for this activity (e.g., 'Sun hat', 'Formal attire').",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            category: { type: "string" },
          },
          required: ["label"],
        },
      },
      source_citations: {
        type: "array",
        items: { type: "string" },
        description: "URLs of the web pages you used to research this proposal.",
      },
    },
    required: ["title", "description", "category", "cost_per_person", "location", "date"],
  },
};

// -------------------------- System prompt --------------------------

export function buildSystemPrompt(trip: Trip): string {
  const activitiesSummary =
    trip.activities.length === 0
      ? "  (none yet)"
      : [...trip.activities]
          .sort(compareDateTime)
          .map(
            (a) =>
              `  - ${fmtDayHeader(a.date)} ${a.startTime ?? ""} — ${a.title} (${a.category}, ${a.cost} ${trip.currency})`
          )
          .join("\n");

  return `You are Claude, a friendly and knowledgeable travel co-planner embedded in Wandersail, a personal trip-planning web app. You have two tools: built-in web_search and the custom \`propose_activity\` tool.

Current trip:
- Name: ${trip.name}
- Dates: ${trip.startDate} → ${trip.endDate}
- Currency: ${trip.currency}
- Existing activities (${trip.activities.length}):
${activitiesSummary}

How to help the user:
1. If the user asks what to do somewhere, ask at most one or two clarifying questions about interests, budget, or pace. Don't over-interview — if you can make progress with web_search, do it.
2. Use web_search liberally to find real, current information: hours, addresses, prices, whether tickets must be booked ahead, etc. Do NOT guess these.
3. Present 2–5 options as a concise markdown list. Each option: name, one-sentence pitch, rough cost, why it might suit them.
4. When the user picks an option and you have all the details, call \`propose_activity\` with complete, accurate fields. Then STOP — do not write more text until the tool_result comes back. The user will review and either accept or ask you to revise.
5. In \`linked_tasks\`, include concrete booking/prep tasks with reasonable due dates (e.g., "Book timed-entry tickets" with due_date 2 days before the activity).
6. In \`linked_packing\`, include items that matter for THIS specific activity ("Swimsuit", "Hiking boots", "Formal shirt"), not general trip items.
7. Always include \`source_citations\` — the URLs you actually used.

Tone: warm, concise, practical. Use markdown for lists and emphasis. Avoid long preambles. The user is planning a real trip and wants actionable suggestions, not travel-brochure fluff.`;
}

// Convert stored ChatMessage[] to Anthropic SDK Messages format.
// Handles tool_use / tool_result continuity so multi-turn tool flows work.
export function toAnthropicMessages(
  messages: {
    role: "user" | "assistant";
    content: string;
    toolCalls?: {
      id: string;
      name: string;
      input: unknown;
      result?: unknown;
      status: string;
    }[];
  }[]
): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];

  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
      continue;
    }

    // Assistant message — may have text + tool_use blocks
    const blocks: Anthropic.ContentBlockParam[] = [];
    if (m.content) {
      blocks.push({ type: "text", text: m.content });
    }
    if (m.toolCalls && m.toolCalls.length > 0) {
      for (const tc of m.toolCalls) {
        if (tc.name === "propose_activity") {
          blocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.input as Record<string, unknown>,
          });
        }
      }
    }
    if (blocks.length > 0) {
      out.push({ role: "assistant", content: blocks });
    }

    // Follow-up user turn with tool_result for any accepted/rejected tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tc of m.toolCalls ?? []) {
      if (tc.name !== "propose_activity") continue;
      if (tc.status === "accepted") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tc.id,
          content: JSON.stringify({ status: "accepted", result: tc.result }),
        });
      } else if (tc.status === "rejected") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tc.id,
          content: JSON.stringify({ status: "rejected" }),
        });
      } else if (tc.status === "pending_review") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tc.id,
          content: JSON.stringify({ status: "pending_user_review" }),
        });
      }
    }
    if (toolResults.length > 0) {
      out.push({ role: "user", content: toolResults });
    }
  }

  return out;
}
