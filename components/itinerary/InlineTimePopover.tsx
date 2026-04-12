"use client";

import { useState, useRef, useEffect } from "react";
import { TimeSelect } from "@/components/ui/TimeSelect";
import { Clock, X } from "lucide-react";

interface Props {
  startTime: string | undefined;
  endTime: string | undefined;
  onSave: (startTime: string | undefined, endTime: string | undefined) => void;
}

export function InlineTimePopover({ startTime, endTime, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startTime);
  const [draftEnd, setDraftEnd] = useState(endTime);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftStart(startTime);
    setDraftEnd(endTime);
  }, [open, startTime, endTime]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const label = startTime
    ? endTime
      ? `${startTime} – ${endTime}`
      : startTime
    : "Set time";

  const save = () => {
    onSave(draftStart, draftEnd);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="stamp text-[10px] text-teal-dark hover:text-orange flex items-center gap-1 border border-dashed border-transparent hover:border-ink/40 px-1 py-0.5"
      >
        <Clock size={10} /> {label}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 z-40 bg-cream border-2 border-ink p-3 w-80"
          style={{ boxShadow: "4px 4px 0 var(--ink)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="stamp text-[10px] text-orange">Edit time</div>
            <button type="button" onClick={() => setOpen(false)} className="text-ink/60 hover:text-orange">
              <X size={12} />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="stamp text-[9px] text-teal-dark block mb-1">Start</label>
              <TimeSelect value={draftStart} onChange={setDraftStart} />
            </div>
            <div>
              <label className="stamp text-[9px] text-teal-dark block mb-1">End</label>
              <TimeSelect value={draftEnd} onChange={setDraftEnd} />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-poster btn-poster-sm btn-poster-secondary"
            >
              Cancel
            </button>
            <button type="button" onClick={save} className="btn-poster btn-poster-sm">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
