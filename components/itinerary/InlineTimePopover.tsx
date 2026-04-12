"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraftStart(startTime);
    setDraftEnd(endTime);
  }, [open, startTime, endTime]);

  // Position the portal panel next to the trigger button
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const panelWidth = 320;
      const panelHeight = 280;
      // Prefer opening below, flip to above if no room
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= panelHeight + 8 ? rect.bottom + 4 : rect.top - panelHeight - 4;
      // Clamp horizontally to viewport
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) {
        left = window.innerWidth - panelWidth - 8;
      }
      if (left < 8) left = 8;
      setPos({ top, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        triggerRef.current &&
        !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
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
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="stamp text-[10px] text-teal-dark hover:text-orange flex items-center gap-1 border border-dashed border-transparent hover:border-ink/40 px-1 py-0.5"
      >
        <Clock size={10} /> {label}
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed bg-cream border-2 border-ink p-3 w-80"
            style={{
              top: pos.top,
              left: pos.left,
              boxShadow: "4px 4px 0 var(--ink)",
              zIndex: 100,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="stamp text-[10px] text-orange">Edit time</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink/60 hover:text-orange"
              >
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
          </div>,
          document.body
        )}
    </>
  );
}
