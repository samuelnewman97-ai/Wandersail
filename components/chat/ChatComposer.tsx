"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({ value, onChange, onSend, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="border-t-2 border-ink bg-cream p-3 flex gap-2 items-end">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={disabled}
        placeholder={placeholder ?? "Tell Claude about your trip goals…"}
        rows={1}
        className="field-input flex-1 resize-none text-sm"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="btn-poster btn-poster-sm disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
