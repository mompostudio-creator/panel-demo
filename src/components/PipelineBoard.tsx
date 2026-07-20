"use client";

import { useState } from "react";
import Link from "next/link";
import { Kanban, CalendarCheck, Sparkles, XCircle, SlidersHorizontal, Check } from "lucide-react";
import { Card, StatTile } from "@/components/ui";
import { useAppData } from "@/lib/store";
import type { PipelineStage } from "@/lib/types";

const AVATAR_TONES = [
  { bg: "bg-accent-light", text: "text-accent" },
  { bg: "bg-violet-bg", text: "text-violet" },
  { bg: "bg-teal-bg", text: "text-teal" },
  { bg: "bg-warning-bg", text: "text-[#946200]" },
];

const STAGE_TONES: Record<string, { bg: string; border: string }> = {
  "nuevo-lead": { bg: "bg-accent-light/50", border: "border-accent/20" },
  "visita-agendada": { bg: "bg-violet-bg/40", border: "border-violet/20" },
  diagnostico: { bg: "bg-warning-bg/50", border: "border-warning/20" },
  "presupuesto-enviado": { bg: "bg-serious-bg/50", border: "border-serious/20" },
  "en-seguimiento": { bg: "bg-serious-bg/50", border: "border-serious/20" },
  aceptado: { bg: "bg-good-bg/50", border: "border-good/20" },
  "tratamiento-en-curso": { bg: "bg-accent-light/50", border: "border-accent/20" },
  finalizado: { bg: "bg-good-bg/50", border: "border-good/20" },
  perdido: { bg: "bg-critical-bg/50", border: "border-critical/20" },
};

function toneForStage(id: string) {
  return STAGE_TONES[id] ?? { bg: "bg-plane", border: "border-border" };
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function toneForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function PipelineBoard({ stages }: { stages: PipelineStage[] }) {
  const { pipelineCards } = useAppData();
  const [stageFilter, setStageFilter] = useState<string | "Todas">("Todas");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const totalCount = pipelineCards.length;
  const firstVisitCount = pipelineCards.filter((c) => c.stageId === "visita-agendada").length;
  const followUpCount = pipelineCards.filter((c) => c.stageId === "en-seguimiento").length;
  const lostCount = pipelineCards.filter((c) => c.stageId === "perdido").length;

  const visibleStages = stageFilter === "Todas" ? stages : stages.filter((s) => s.id === stageFilter);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-ink-secondary mt-1.5">En qué punto del proceso automático está cada paciente.</p>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors ${
              stageFilter !== "Todas" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 mt-1 w-56 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <button
                  onClick={() => {
                    setStageFilter("Todas");
                    setFiltersOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todas las etapas
                  {stageFilter === "Todas" && <Check size={13} className="text-accent" />}
                </button>
                {stages.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStageFilter(s.id);
                      setFiltersOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      {s.emoji} {s.label}
                    </span>
                    {stageFilter === s.id && <Check size={13} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Oportunidades totales" value={String(totalCount)} icon={Kanban} tone="accent" />
        <StatTile label="Visita agendada" value={String(firstVisitCount)} icon={CalendarCheck} tone="violet" />
        <StatTile label="En seguimiento" value={String(followUpCount)} icon={Sparkles} tone="serious" />
        <StatTile label="Perdidos" value={String(lostCount)} icon={XCircle} tone="critical" />
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-10 md:px-10">
        <div className="flex items-stretch gap-4 min-w-max">
          {visibleStages.map((stage) => {
            const stageCards = pipelineCards.filter((c) => c.stageId === stage.id);
            const tone = toneForStage(stage.id);
            return (
              <div
                key={stage.id}
                className={`w-72 shrink-0 flex flex-col rounded-2xl border p-3 ${tone.bg} ${tone.border}`}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm">{stage.emoji}</span>
                  <p className="text-sm font-bold tracking-tight flex-1 truncate text-ink">{stage.label}</p>
                </div>
                <p className="text-xs font-medium px-1 mt-0.5 mb-3 text-ink-secondary">
                  {stageCards.length} {stageCards.length === 1 ? "oportunidad" : "oportunidades"}
                </p>

                <div className="flex-1 space-y-2 min-h-[60px]">
                  {stageCards.length === 0 && (
                    <div className="h-16 rounded-xl border border-dashed border-white/70 bg-white/30 flex items-center justify-center">
                      <span className="text-[11px] text-ink-secondary">Vacío</span>
                    </div>
                  )}
                  {stageCards.map((card) => {
                    const avatarTone = toneForId(card.id);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{card.clientName}</p>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTone.bg} ${avatarTone.text}`}
                          >
                            {initials(card.clientName)}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5 truncate">{card.detail}</p>
                      </>
                    );
                    return (
                      <Card key={card.id} className="h-[132px] p-3.5 flex flex-col hover:border-accent/40 transition-colors">
                        {card.clientId ? (
                          <Link href={`/pacientes/${card.clientId}`} className="block">
                            {content}
                          </Link>
                        ) : (
                          <div>{content}</div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {card.reminders && (
                            <>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  card.reminders.h24 ? "bg-good-bg text-good" : "bg-plane text-ink-muted"
                                }`}
                              >
                                24h {card.reminders.h24 ? "✓" : ""}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  card.reminders.h1 ? "bg-good-bg text-good" : "bg-plane text-ink-muted"
                                }`}
                              >
                                1h {card.reminders.h1 ? "✓" : ""}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted mt-auto pt-2">{card.updated}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
