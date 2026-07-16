"use client";

import { useRef, useState } from "react";
import { PROFESSIONALS, type Appointment } from "@/lib/types";

const HOUR_START = 9;
const HOUR_END = 20;
const HOUR_HEIGHT = 64;
const BLOCK_HEIGHT = 46;

const PROFESSIONAL_TONES = [
  { bg: "bg-accent-light", border: "border-accent/30", text: "text-accent", avatarBg: "bg-accent-light", avatarText: "text-accent" },
  { bg: "bg-violet-bg", border: "border-violet/30", text: "text-violet", avatarBg: "bg-violet-bg", avatarText: "text-violet" },
  { bg: "bg-teal-bg", border: "border-teal/30", text: "text-teal", avatarBg: "bg-teal-bg", avatarText: "text-teal" },
  {
    bg: "bg-warning-bg",
    border: "border-warning/30",
    text: "text-[#946200]",
    avatarBg: "bg-warning-bg",
    avatarText: "text-[#946200]",
  },
  { bg: "bg-good-bg", border: "border-good/30", text: "text-good", avatarBg: "bg-good-bg", avatarText: "text-good" },
];

function toneForProfessional(name: string) {
  const i = PROFESSIONALS.findIndex((p) => p.name === name);
  return PROFESSIONAL_TONES[i >= 0 ? i % PROFESSIONAL_TONES.length : 0];
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function minutesFromDayStart(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - HOUR_START) * 60 + m;
}

export function AgendaDaySchedule({
  dayAppointments,
  professionals,
  onSelect,
}: {
  dayAppointments: Appointment[];
  professionals: string[];
  onSelect: (a: Appointment) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverY(e.clientY - rect.top);
  }

  const hoverLabel = (() => {
    if (hoverY === null) return null;
    const totalMinutes = HOUR_START * 60 + (hoverY / HOUR_HEIGHT) * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  const byProfessional = new Map<string, Appointment[]>();
  for (const name of professionals) byProfessional.set(name, []);
  for (const a of dayAppointments) {
    if (!byProfessional.has(a.professionalName)) byProfessional.set(a.professionalName, []);
    byProfessional.get(a.professionalName)!.push(a);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(11,11,11,0.04),0_1px_1px_rgba(11,11,11,0.03)]">
      <div className="flex border-b border-border">
        <div className="w-16 shrink-0" />
        {professionals.map((name) => {
          const prof = PROFESSIONALS.find((p) => p.name === name);
          const tone = toneForProfessional(name);
          return (
            <div key={name} className="flex-1 min-w-0 flex items-center gap-2.5 px-4 py-3 border-l border-border">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${tone.avatarBg} ${tone.avatarText}`}
              >
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-ink-muted truncate">{prof?.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={gridRef}
        className="flex relative"
        style={{ height: gridHeight + 14 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverY(null)}
      >
        <div className="w-16 shrink-0 relative">
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 text-[11px] text-ink-muted px-2 -translate-y-1/2"
              style={{ top: i * HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
          {hoverY !== null && (
            <div className="absolute left-0 right-1 flex justify-end -translate-y-1/2 z-10 pointer-events-none" style={{ top: hoverY }}>
              <span className="text-[10px] font-semibold text-white bg-critical rounded px-1.5 py-0.5 tabular">{hoverLabel}</span>
            </div>
          )}
        </div>

        {professionals.map((name) => {
          const tone = toneForProfessional(name);
          return (
            <div key={name} className="flex-1 min-w-0 relative border-l border-border">
              {hours.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 border-t border-border/70" style={{ top: i * HOUR_HEIGHT }} />
              ))}

              {(byProfessional.get(name) ?? []).map((a) => {
                const top = minutesFromDayStart(a.time) * (HOUR_HEIGHT / 60);
                if (top < 0 || top > gridHeight) return null;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className={`absolute left-1.5 right-1.5 rounded-lg border px-2 py-1 text-left overflow-hidden hover:opacity-80 transition-opacity flex flex-col justify-center gap-0 z-[1] ${tone.bg} ${tone.border}`}
                    style={{ top, height: BLOCK_HEIGHT }}
                  >
                    <p className={`text-[11px] font-semibold leading-tight truncate ${tone.text}`}>{a.time}</p>
                    <p className="text-[11px] font-medium leading-tight truncate">{a.clientName}</p>
                    <p className="text-[10px] text-ink-muted leading-tight truncate">{a.service}</p>
                  </button>
                );
              })}
            </div>
          );
        })}

        {hoverY !== null && (
          <div className="absolute left-16 right-0 h-px bg-critical z-10 pointer-events-none" style={{ top: hoverY }} />
        )}
      </div>
    </div>
  );
}
