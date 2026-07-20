"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  Phone,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Star,
  Check,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  MoreHorizontal,
  Plus,
  ListChecks,
  Clock,
  CalendarDays,
  CheckCircle2,
  Zap,
  Sparkles,
} from "lucide-react";
import { StatusBadge, StatTile, inputClass, FieldLabel, Modal } from "@/components/ui";
import { useAppData } from "@/lib/store";
import { formatRelativeTime, formatSpanishDate, addDays } from "@/lib/dates";
import { PROFESSIONALS } from "@/lib/types";
import { SAMPLE_ACTIVITIES, SUPPORT_STAFF, type ActivityStatus, type ActivityType, type SampleActivity } from "@/lib/activitySampleData";

const TYPE_META: Record<ActivityType, { icon: typeof MessageCircle; bg: string; text: string; label: string }> = {
  whatsapp: { icon: MessageCircle, bg: "bg-good-bg", text: "text-good", label: "WhatsApp" },
  email: { icon: Mail, bg: "bg-accent-light", text: "text-accent", label: "Email" },
  call: { icon: Phone, bg: "bg-violet-bg", text: "text-violet", label: "Llamada" },
  calendar: { icon: CalendarClock, bg: "bg-teal-bg", text: "text-teal", label: "Cita" },
  payment: { icon: CircleDollarSign, bg: "bg-serious-bg", text: "text-serious", label: "Cobro" },
  document: { icon: FileText, bg: "bg-accent-light", text: "text-accent", label: "Documento" },
  review: { icon: Star, bg: "bg-warning-bg", text: "text-[#946200]", label: "Reseña" },
};

const STATUS_FILTERS: ("Todas" | ActivityStatus)[] = ["Todas", "Pendiente", "En proceso", "Completada", "Cancelada"];
const PAGE_SIZE = 8;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function groupLabel(offset: number, date: Date): string {
  const raw =
    offset === 0
      ? "Hoy"
      : offset === 1
        ? "Mañana"
        : offset === -1
          ? "Ayer"
          : ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][date.getDay()];
  const rest = `${date.getDate()} de ${
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][
      date.getMonth()
    ]
  }`;
  return `${raw}, ${rest}`;
}

function dueInfo(a: SampleActivity): { label: string; tone: string } {
  const now = new Date();
  const due = addDays(now, a.daysOffset);
  const [h, m] = a.time.split(":").map(Number);
  due.setHours(h, m, 0, 0);
  const isPast = due.getTime() < now.getTime();

  if (a.status === "Completada") return { label: `${a.daysOffset === 0 ? "Hoy" : formatSpanishDate(due)} ${a.time}`, tone: "text-ink-muted" };
  if (a.status === "Cancelada") return { label: `${a.daysOffset === 0 ? "Hoy" : formatSpanishDate(due)} ${a.time}`, tone: "text-ink-muted" };
  if (a.daysOffset === 0 && isPast) return { label: `Vencida ${a.time}`, tone: "text-critical" };
  if (a.daysOffset === 0) return { label: `Hoy ${a.time}`, tone: "text-serious" };
  if (a.daysOffset === 1) return { label: `Mañana ${a.time}`, tone: "text-good" };
  return { label: `${formatSpanishDate(due)}, ${a.time}`, tone: "text-good" };
}

export function ActividadesClient() {
  const { activityLog } = useAppData();
  const [activities, setActivities] = useState<SampleActivity[]>(SAMPLE_ACTIVITIES);
  const [statusFilter, setStatusFilter] = useState<"Todas" | ActivityStatus>("Todas");
  const [typeFilter, setTypeFilter] = useState<"Todos" | ActivityType>("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("Todos");
  const [openFilter, setOpenFilter] = useState<"tipo" | "responsable" | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [pages, setPages] = useState<Record<number, number>>({});
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPatient, setNewPatient] = useState("");
  const [newResponsible, setNewResponsible] = useState(SUPPORT_STAFF[0].name);
  const [newOffset, setNewOffset] = useState(0);

  const allResponsibles = [
    ...SUPPORT_STAFF.map((s) => s.name),
    ...PROFESSIONALS.map((p) => p.name),
    "Automatización",
  ];

  const filtered = activities.filter((a) => {
    if (statusFilter !== "Todas" && a.status !== statusFilter) return false;
    if (typeFilter !== "Todos" && a.type !== typeFilter) return false;
    if (responsibleFilter !== "Todos" && a.responsibleName !== responsibleFilter) return false;
    return true;
  });

  const groups = new Map<number, SampleActivity[]>();
  for (const a of filtered) {
    if (!groups.has(a.daysOffset)) groups.set(a.daysOffset, []);
    groups.get(a.daysOffset)!.push(a);
  }
  const sortedOffsets = Array.from(groups.keys()).sort((x, y) => x - y);

  const pendingCount = activities.filter((a) => a.status === "Pendiente").length;
  const dueTodayCount = activities.filter((a) => a.status === "Pendiente" && a.daysOffset === 0).length;
  const dueTomorrowCount = activities.filter((a) => a.status === "Pendiente" && a.daysOffset === 1).length;
  const completedCount = activities.filter((a) => a.status === "Completada").length;

  const upcoming = activities
    .filter((a) => a.status === "Pendiente" || a.status === "Programada")
    .filter((a) => a.daysOffset >= 0)
    .sort((a, b) => a.daysOffset - b.daysOffset || a.time.localeCompare(b.time))
    .slice(0, 4);

  function setStatus(id: string, status: ActivityStatus) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setMenuFor(null);
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newPatient.trim()) return;
    const resp = allResponsibles.includes(newResponsible) ? newResponsible : SUPPORT_STAFF[0].name;
    const respMeta =
      SUPPORT_STAFF.find((s) => s.name === resp) ??
      PROFESSIONALS.find((p) => p.name === resp) ??
      { name: "Automatización", role: "Sistema" };
    setActivities((prev) => [
      {
        id: `act-new-${Date.now()}`,
        type: "document",
        title: newTitle.trim(),
        context: "Actividad creada manualmente",
        patientName: newPatient.trim(),
        patientCode: "",
        responsibleName: respMeta.name,
        responsibleRole: respMeta.role,
        daysOffset: newOffset,
        time: "09:00",
        status: "Pendiente",
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewPatient("");
    setNewResponsible(SUPPORT_STAFF[0].name);
    setNewOffset(0);
    setAddOpen(false);
    setExpanded((prev) => new Set(prev).add(newOffset));
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-sm text-ink-secondary mt-1.5">Tu bandeja de trabajo: todas las tareas y acciones pendientes.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150 shrink-0"
        >
          <Plus size={15} />
          Nueva actividad
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 bg-plane rounded-lg p-1 max-w-full overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === s ? "bg-accent text-white shadow-sm" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {s === "Todas" ? "Todas" : s}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenFilter(openFilter === "tipo" ? null : "tipo")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              typeFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {typeFilter === "Todos" ? "Todos los tipos" : TYPE_META[typeFilter].label}
          </button>
          {openFilter === "tipo" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
              <div className="absolute left-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <button
                  onClick={() => {
                    setTypeFilter("Todos");
                    setOpenFilter(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todos los tipos
                  {typeFilter === "Todos" && <Check size={13} className="text-accent" />}
                </button>
                {(Object.keys(TYPE_META) as ActivityType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setOpenFilter(null);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    {TYPE_META[t].label}
                    {typeFilter === t && <Check size={13} className="text-accent" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenFilter(openFilter === "responsable" ? null : "responsable")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              responsibleFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {responsibleFilter === "Todos" ? "Todos los responsables" : responsibleFilter}
          </button>
          {openFilter === "responsable" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
              <div className="absolute left-0 mt-1 w-56 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5 max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setResponsibleFilter("Todos");
                    setOpenFilter(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todos los responsables
                  {responsibleFilter === "Todos" && <Check size={13} className="text-accent" />}
                </button>
                {allResponsibles.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setResponsibleFilter(name);
                      setOpenFilter(null);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{name}</span>
                    {responsibleFilter === name && <Check size={13} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-3 min-w-0">
          {sortedOffsets.length === 0 && (
            <div className="h-32 rounded-2xl border border-dashed border-border flex items-center justify-center">
              <span className="text-sm text-ink-muted">No hay actividades que coincidan con los filtros</span>
            </div>
          )}
          {sortedOffsets.map((offset) => {
            const items = groups.get(offset)!;
            const isOpen = expanded.has(offset);
            const page = pages[offset] ?? 1;
            const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
            const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            const label = groupLabel(offset, addDays(new Date(), offset));

            return (
              <div key={offset} className="bg-surface border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(offset)) next.delete(offset);
                      else next.add(offset);
                      return next;
                    })
                  }
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-plane transition-colors"
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-ink-muted">
                      {items.length} {items.length === 1 ? "actividad" : "actividades"}
                    </span>
                    {isOpen ? <ChevronDown size={15} className="text-ink-muted" /> : <ChevronRightIcon size={15} className="text-ink-muted" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[566px] text-sm table-fixed">
                      <thead>
                        <tr className="text-left text-xs font-medium text-ink-muted border-b border-border">
                          <th className="py-2.5 px-5">Actividad</th>
                          <th className="py-2.5 px-4 w-[135px]">Paciente</th>
                          <th className="py-2.5 px-4 w-[135px]">Responsable</th>
                          <th className="py-2.5 px-4 w-[130px]">Vence</th>
                          <th className="py-2.5 px-4 w-[110px]">Estado</th>
                          <th className="py-2.5 px-3 w-[56px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((a) => {
                          const meta = TYPE_META[a.type];
                          const Icon = meta.icon;
                          const due = dueInfo(a);
                          return (
                            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-plane transition-colors">
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                                    <Icon size={15} className={meta.text} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{a.title}</p>
                                    <p className="text-xs text-ink-muted truncate">{a.context}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent shrink-0">
                                    {initials(a.patientName)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{a.patientName}</p>
                                    {a.patientCode && <p className="text-[11px] text-ink-muted truncate">{a.patientCode}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-7 h-7 rounded-full bg-violet-bg flex items-center justify-center text-[10px] font-semibold text-violet shrink-0">
                                    {initials(a.responsibleName)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{a.responsibleName}</p>
                                    <p className="text-[11px] text-ink-muted truncate">{a.responsibleRole}</p>
                                  </div>
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-xs font-medium ${due.tone}`}>{due.label}</td>
                              <td className="py-3 px-4">
                                <StatusBadge status={a.status} />
                              </td>
                              <td className="py-3 px-3">
                                <div className="relative flex justify-end">
                                  <button
                                    onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                                    className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white transition-colors"
                                  >
                                    <MoreHorizontal size={15} />
                                  </button>
                                  {menuFor === a.id && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                                      <div className="absolute right-0 top-8 w-44 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                                        <button
                                          onClick={() => setStatus(a.id, "En proceso")}
                                          className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                        >
                                          Marcar en proceso
                                        </button>
                                        <button
                                          onClick={() => setStatus(a.id, "Completada")}
                                          className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                        >
                                          Marcar completada
                                        </button>
                                        <button
                                          onClick={() => setStatus(a.id, "Cancelada")}
                                          className="w-full text-left px-3.5 py-2 text-sm text-critical hover:bg-critical-bg"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                        <p className="text-xs text-ink-muted">
                          Mostrando {(page - 1) * PAGE_SIZE + 1} a {Math.min(page * PAGE_SIZE, items.length)} de {items.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPages((p) => ({ ...p, [offset]: Math.max(1, page - 1) }))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-xs text-ink-muted tabular">
                            Página {page} de {totalPages}
                          </span>
                          <button
                            onClick={() => setPages((p) => ({ ...p, [offset]: Math.min(totalPages, page + 1) }))}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40"
                          >
                            <ChevronRightIcon size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Resumen de actividades</p>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Pendientes" value={String(pendingCount)} icon={ListChecks} tone="accent" />
              <StatTile label="Vencen hoy" value={String(dueTodayCount)} icon={Clock} tone="serious" />
              <StatTile label="Vencen mañana" value={String(dueTomorrowCount)} icon={CalendarDays} tone="warning" />
              <StatTile label="Completadas" value={String(completedCount)} icon={CheckCircle2} tone="good" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Próximas actividades</p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-ink-muted">No hay nada próximo.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => {
                  const meta = TYPE_META[a.type];
                  const Icon = meta.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <Icon size={14} className={meta.text} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{a.title}</p>
                        <p className="text-[11px] text-ink-muted truncate">{a.patientName}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${a.daysOffset === 0 ? "bg-serious-bg text-serious" : "bg-good-bg text-good"}`}>
                        {a.daysOffset === 0 ? "Hoy" : a.daysOffset === 1 ? "Mañana" : `+${a.daysOffset}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Actividad reciente</p>
            {activityLog.length === 0 ? (
              <p className="text-xs text-ink-muted">Sin actividad todavía.</p>
            ) : (
              <div className="space-y-3">
                {activityLog.slice(0, 4).map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-good-bg flex items-center justify-center shrink-0">
                      <Check size={13} className="text-good" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{h.label}</p>
                    </div>
                    <span className="text-[11px] text-ink-muted shrink-0">{formatRelativeTime(h.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/automatizaciones"
            className="flex items-start gap-3 bg-accent-light border border-accent/20 rounded-2xl p-4 hover:opacity-90 transition-opacity"
          >
            <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink">Las actividades automáticas te ayudan a no olvidar nada importante.</p>
              <p className="text-xs text-accent font-medium mt-1 inline-flex items-center gap-1">
                <Zap size={12} />
                Configurar automatizaciones
              </p>
            </div>
          </Link>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nueva actividad">
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div>
            <FieldLabel>Título</FieldLabel>
            <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputClass} placeholder="Ej. Llamar para confirmar" />
          </div>
          <div>
            <FieldLabel>Paciente</FieldLabel>
            <input required value={newPatient} onChange={(e) => setNewPatient(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Responsable</FieldLabel>
              <select value={newResponsible} onChange={(e) => setNewResponsible(e.target.value)} className={inputClass}>
                {allResponsibles.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Vence</FieldLabel>
              <select value={newOffset} onChange={(e) => setNewOffset(Number(e.target.value))} className={inputClass}>
                <option value={0}>Hoy</option>
                <option value={1}>Mañana</option>
                <option value={2}>En 2 días</option>
                <option value={7}>En una semana</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
          >
            Crear actividad
          </button>
        </form>
      </Modal>
    </div>
  );
}
