"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  XCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { SectionTitle, StatusBadge, inputClass } from "@/components/ui";
import { AppointmentDetailPanel } from "@/components/AppointmentDetailPanel";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { appointmentDateTime, parseSpanishDate, toISODate, isSameDay, addDays, startOfWeek } from "@/lib/dates";
import { useAppData } from "@/lib/store";
import { PROFESSIONALS, type Appointment } from "@/lib/types";

const STATUS_OPTIONS: Appointment["status"][] = ["Confirmada", "Modificada", "Completada", "Cancelada"];
const DATE_RANGES = ["Todas", "Hoy", "Mañana", "Esta semana", "Este mes"] as const;
type DateRange = (typeof DATE_RANGES)[number];
const PAGE_SIZE = 8;

const PROFESSIONAL_TONES = [
  { bg: "bg-accent-light", text: "text-accent" },
  { bg: "bg-violet-bg", text: "text-violet" },
  { bg: "bg-teal-bg", text: "text-teal" },
  { bg: "bg-warning-bg", text: "text-[#946200]" },
  { bg: "bg-good-bg", text: "text-good" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function toneForProfessional(name: string) {
  const i = PROFESSIONALS.findIndex((p) => p.name === name);
  return PROFESSIONAL_TONES[i >= 0 ? i % PROFESSIONAL_TONES.length : 0];
}

function matchesDateRange(a: Appointment, range: DateRange, exactDate: string | null): boolean {
  const d = parseSpanishDate(a.date);
  if (exactDate) return toISODate(d) === exactDate;
  if (range === "Todas") return true;
  const now = new Date();
  if (range === "Hoy") return isSameDay(d, now);
  if (range === "Mañana") return isSameDay(d, addDays(now, 1));
  if (range === "Esta semana") {
    const start = startOfWeek(now);
    const end = addDays(start, 6);
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  }
  if (range === "Este mes") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  return true;
}

export function AgendaList() {
  const { appointments, clients, addAppointment, cancelAppointment, rescheduleAppointment, setAppointmentStatus, updateAppointmentDetails } =
    useAppData();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("Todas");
  const [exactDate, setExactDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Appointment["status"] | "Todos">("Todos");
  const [professionalFilter, setProfessionalFilter] = useState<string | "Todos">("Todos");
  const [filtersOpen, setFiltersOpen] = useState<"estado" | "profesional" | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const clientsById = new Map(clients.map((c) => [c.id, c]));

  const filtered = appointments.filter((a) => {
    if (query.trim() && !a.clientName.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
    if (professionalFilter !== "Todos" && a.professionalName !== professionalFilter) return false;
    if (!matchesDateRange(a, dateRange, exactDate)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const diff = appointmentDateTime(a).getTime() - appointmentDateTime(b).getTime();
    return sortDesc ? -diff : diff;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div>
      <SectionTitle
        title="Citas"
        subtitle="Gestiona todas las citas de tu clínica"
        action={
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150"
          >
            <Plus size={15} />
            Nueva cita
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 bg-plane rounded-lg p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setDateRange(r);
                setExactDate(null);
                resetPage();
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                !exactDate && dateRange === r ? "bg-accent shadow-sm text-white" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className={`relative inline-flex items-center border rounded-lg ${exactDate ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary"}`}>
          <Calendar size={13} className="ml-2.5 pointer-events-none shrink-0" />
          <input
            type="date"
            value={exactDate ?? ""}
            onChange={(e) => {
              setExactDate(e.target.value || null);
              resetPage();
            }}
            className="text-xs bg-transparent pl-1.5 pr-2.5 py-2 w-[130px]"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setFiltersOpen(filtersOpen === "estado" ? null : "estado")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              statusFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {statusFilter === "Todos" ? "Todos los estados" : statusFilter}
          </button>
          {filtersOpen === "estado" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(null)} />
              <div className="absolute left-0 mt-1 w-44 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <button
                  onClick={() => {
                    setStatusFilter("Todos");
                    resetPage();
                    setFiltersOpen(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todos los estados
                  {statusFilter === "Todos" && <Check size={13} className="text-accent" />}
                </button>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      resetPage();
                      setFiltersOpen(null);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    {s}
                    {statusFilter === s && <Check size={13} className="text-accent" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setFiltersOpen(filtersOpen === "profesional" ? null : "profesional")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              professionalFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {professionalFilter === "Todos" ? "Todos los profesionales" : professionalFilter}
          </button>
          {filtersOpen === "profesional" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(null)} />
              <div className="absolute left-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <button
                  onClick={() => {
                    setProfessionalFilter("Todos");
                    resetPage();
                    setFiltersOpen(null);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todos los profesionales
                  {professionalFilter === "Todos" && <Check size={13} className="text-accent" />}
                </button>
                {PROFESSIONALS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setProfessionalFilter(p.name);
                      resetPage();
                      setFiltersOpen(null);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{p.name}</span>
                    {professionalFilter === p.name && <Check size={13} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Buscar paciente…"
            className={`${inputClass} pl-8 py-2 text-xs`}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="h-32 rounded-2xl border border-dashed border-border flex items-center justify-center">
          <span className="text-sm text-ink-muted">No hay citas que coincidan con los filtros</span>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(11,11,11,0.04),0_1px_1px_rgba(11,11,11,0.03)]">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[910px] text-sm table-fixed">
            <thead>
              <tr className="text-left text-xs font-medium text-ink-muted border-b border-border">
                <th className="py-3 pl-6 pr-4 whitespace-nowrap w-[150px]">
                  <button
                    onClick={() => setSortDesc((v) => !v)}
                    className="inline-flex items-center gap-1 hover:text-ink transition-colors whitespace-nowrap"
                  >
                    Fecha y hora
                    <ChevronsUpDown size={12} />
                  </button>
                </th>
                <th className="py-3 px-4 w-[180px]">Paciente</th>
                <th className="py-3 px-4 w-[200px]">Motivo</th>
                <th className="py-3 px-4 w-[200px]">Profesional</th>
                <th className="py-3 px-4 w-[110px]">Estado</th>
                <th className="py-3 px-5 text-right w-[70px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => {
                const isOverdue =
                  (a.status === "Confirmada" || a.status === "Modificada") && appointmentDateTime(a).getTime() < Date.now();
                const proTone = toneForProfessional(a.professionalName);
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`border-b border-border last:border-0 transition-colors cursor-pointer ${
                      selected?.id === a.id ? "bg-accent-light hover:bg-accent-light" : "hover:bg-plane"
                    }`}
                  >
                    <td className="py-3.5 pl-6 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{a.date}</p>
                          <p className="text-xs text-ink-muted tabular">{a.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                          {initials(a.clientName)}
                        </span>
                        <p className="text-sm font-semibold truncate min-w-0">{a.clientName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-secondary truncate">{a.service}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${proTone.bg} ${proTone.text}`}
                        >
                          {initials(a.professionalName)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.professionalName}</p>
                          <p className="text-xs text-ink-muted truncate">{a.professionalRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={isOverdue ? "Vencida" : a.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white transition-colors"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {menuFor === a.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                              <div className="absolute right-0 mt-1 w-40 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                                <button
                                  onClick={() => {
                                    setSelected(a);
                                    setMenuFor(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                >
                                  Ver detalle
                                </button>
                                {a.status !== "Cancelada" && a.status !== "Completada" && (
                                  <button
                                    onClick={() => {
                                      setAppointmentStatus(a.id, "Completada");
                                      setMenuFor(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-sm text-good hover:bg-good-bg flex items-center gap-2"
                                  >
                                    <CheckCircle2 size={13} />
                                    Marcar Completada
                                  </button>
                                )}
                                {a.status !== "Cancelada" && a.status !== "Completada" && (
                                  <button
                                    onClick={() => {
                                      cancelAppointment(a.id);
                                      setMenuFor(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-sm text-critical hover:bg-critical-bg flex items-center gap-2"
                                  >
                                    <XCircle size={13} />
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
            <p className="text-xs text-ink-muted">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, sorted.length)} de {sorted.length} citas
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-ink-muted tabular">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <AppointmentDetailPanel
          appointment={selected}
          patient={selected.clientId ? clientsById.get(selected.clientId) ?? null : null}
          onClose={() => setSelected(null)}
          onCancel={cancelAppointment}
          onReschedule={rescheduleAppointment}
          onSetStatus={setAppointmentStatus}
          onUpdateDetails={updateAppointmentDetails}
        />
      )}

      <NewAppointmentModal open={newOpen} onClose={() => setNewOpen(false)} clients={clients} onCreate={addAppointment} />
    </div>
  );
}
