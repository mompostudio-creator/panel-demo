"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check, SlidersHorizontal } from "lucide-react";
import {
  DAYS_ES,
  DAYS_ES_MON_FIRST,
  MONTHS_LONG_ES,
  addDays,
  formatSpanishDate,
  getMonthGridDays,
  isSameDay,
  startOfWeek,
  toISODate,
} from "@/lib/dates";
import { StatusBadge } from "@/components/ui";
import { AppointmentDetailPanel } from "@/components/AppointmentDetailPanel";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { AgendaDaySchedule } from "@/components/AgendaDaySchedule";
import { AgendaSidebar } from "@/components/AgendaSidebar";
import { useAppData } from "@/lib/store";
import { PROFESSIONALS, type Appointment } from "@/lib/types";
import { AGENDA_SAMPLE_APPOINTMENTS } from "@/lib/agendaSampleData";

type View = "month" | "week" | "day";

const STATUS_DOT: Record<string, string> = {
  Confirmada: "bg-good",
  Completada: "bg-good",
  Modificada: "bg-accent",
  Cancelada: "bg-critical",
};

export function Calendar({ initialDate }: { initialDate: string }) {
  const {
    appointments: allAppointments,
    clients,
    addAppointment,
    cancelAppointment,
    rescheduleAppointment,
    setAppointmentStatus,
    updateAppointmentDetails,
  } = useAppData();
  const [view, setView] = useState<View>("day");
  const [current, setCurrent] = useState(() => new Date(initialDate));
  const [miniMonth, setMiniMonth] = useState(() => new Date(initialDate));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [professionalFilter, setProfessionalFilter] = useState<string | "Todos">("Todos");
  const [profFilterOpen, setProfFilterOpen] = useState(false);
  const today = new Date(initialDate);

  const clientsById = new Map(clients.map((c) => [c.id, c]));

  // Las de muestra solo existen aquí, en memoria: nunca se guardan ni se ven
  // en Citas, que lee directamente las reservas reales del store.
  const combinedAppointments = [...allAppointments, ...AGENDA_SAMPLE_APPOINTMENTS];
  const appointmentList =
    professionalFilter === "Todos" ? combinedAppointments : combinedAppointments.filter((a) => a.professionalName === professionalFilter);

  const byDate = new Map<string, Appointment[]>();
  for (const a of appointmentList) {
    if (a.status === "Cancelada") continue;
    if (!byDate.has(a.date)) byDate.set(a.date, []);
    byDate.get(a.date)!.push(a);
  }
  const getDayAppointments = (d: Date) =>
    (byDate.get(formatSpanishDate(d)) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));

  function shift(delta: number) {
    if (view === "month") {
      setCurrent(new Date(current.getFullYear(), current.getMonth() + delta, 1));
    } else if (view === "week") {
      setCurrent(addDays(current, delta * 7));
    } else {
      setCurrent(addDays(current, delta));
    }
  }

  function goToday() {
    setCurrent(today);
    setMiniMonth(today);
  }

  function selectDayFromSidebar(d: Date) {
    setCurrent(d);
    setView("day");
  }

  function moveAppointmentToDay(appointmentId: string, targetDay: Date) {
    const appointment = allAppointments.find((a) => a.id === appointmentId);
    if (!appointment) return;
    const targetLabel = formatSpanishDate(targetDay);
    if (targetLabel === appointment.date) return;
    rescheduleAppointment(appointmentId, targetLabel, appointment.time);
  }

  const rawLabel =
    view === "month"
      ? `${MONTHS_LONG_ES[current.getMonth()]} ${current.getFullYear()}`
      : view === "week"
        ? (() => {
            const start = startOfWeek(current);
            const end = addDays(start, 6);
            return `${start.getDate()} – ${end.getDate()} ${MONTHS_LONG_ES[end.getMonth()]} ${end.getFullYear()}`;
          })()
        : `${current.getDate()} de ${MONTHS_LONG_ES[current.getMonth()]}, ${current.getFullYear()}`;
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const visibleProfessionals = professionalFilter === "Todos" ? PROFESSIONALS.map((p) => p.name) : [professionalFilter];

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-plane transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => shift(-1)}
              className="p-2 rounded-lg border border-border hover:bg-plane transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => shift(1)}
              className="p-2 rounded-lg border border-border hover:bg-plane transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight size={15} />
            </button>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-border">
              <CalendarIcon size={14} className="text-accent" />
              {label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-plane rounded-lg p-1">
              {(["day", "week", "month"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    view === v ? "bg-accent text-white shadow-sm" : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setProfFilterOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
                  professionalFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
                }`}
              >
                <SlidersHorizontal size={13} />
                {professionalFilter === "Todos" ? "Todos los profesionales" : professionalFilter}
              </button>
              {profFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfFilterOpen(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                    <button
                      onClick={() => {
                        setProfessionalFilter("Todos");
                        setProfFilterOpen(false);
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
                          setProfFilterOpen(false);
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

            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150"
            >
              <Plus size={15} />
              Nueva cita
            </button>
          </div>
        </div>

        {view === "month" && (
          <MonthGrid
            current={current}
            today={today}
            getDayAppointments={getDayAppointments}
            onSelectDay={(d) => {
              setCurrent(d);
              setMiniMonth(d);
              setView("day");
            }}
            draggedId={draggedId}
            onDragStart={setDraggedId}
            onDragEnd={() => setDraggedId(null)}
            onDropDay={moveAppointmentToDay}
          />
        )}
        {view === "week" && (
          <WeekGrid
            current={current}
            today={today}
            getDayAppointments={getDayAppointments}
            onSelect={setSelected}
            draggedId={draggedId}
            onDragStart={setDraggedId}
            onDragEnd={() => setDraggedId(null)}
            onDropDay={moveAppointmentToDay}
          />
        )}
        {view === "day" && (
          <AgendaDaySchedule
            dayAppointments={getDayAppointments(current)}
            professionals={visibleProfessionals}
            onSelect={setSelected}
          />
        )}
      </div>

      <AgendaSidebar
        miniMonth={miniMonth}
        onMiniMonthChange={setMiniMonth}
        selectedDay={current}
        onSelectDay={selectDayFromSidebar}
        today={today}
        getDayAppointments={getDayAppointments}
      />

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

      <NewAppointmentModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        clients={clients}
        onCreate={addAppointment}
        defaultDateISO={toISODate(current)}
      />
    </div>
  );
}

function MonthGrid({
  current,
  today,
  getDayAppointments,
  onSelectDay,
  draggedId,
  onDragStart,
  onDragEnd,
  onDropDay,
}: {
  current: Date;
  today: Date;
  getDayAppointments: (d: Date) => Appointment[];
  onSelectDay: (d: Date) => void;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropDay: (id: string, day: Date) => void;
}) {
  const days = getMonthGridDays(current);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(11,11,11,0.04),0_1px_1px_rgba(11,11,11,0.03)]">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_ES_MON_FIRST.map((d, i) => (
          <div
            key={d}
            className={`text-[11px] font-semibold uppercase tracking-wide px-3 py-2.5 text-center ${
              i >= 5 ? "text-ink-muted/70" : "text-ink-muted"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === current.getMonth();
          const isToday = isSameDay(d, today);
          const isWeekend = i % 7 >= 5;
          const dayAppointments = getDayAppointments(d);
          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedId) onDropDay(draggedId, d);
              }}
              className={`min-h-[112px] border-b border-r border-border ${i % 7 === 6 ? "border-r-0" : ""} ${
                isToday ? "bg-accent-light/50" : isWeekend ? "bg-plane/50" : !inMonth ? "bg-plane/40" : ""
              }`}
            >
              <button onClick={() => onSelectDay(d)} className="w-full h-full p-2.5 text-left hover:bg-plane/70 transition-colors">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    isToday ? "bg-accent text-white" : inMonth ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="mt-2 space-y-1">
                  {dayAppointments.slice(0, 3).map((a) => (
                    <p
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStart(a.id);
                      }}
                      onDragEnd={onDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[11px] text-ink-secondary truncate cursor-grab active:cursor-grabbing bg-plane rounded-md px-1.5 py-1"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? "bg-ink-muted"}`} />
                      <span className="truncate">
                        {a.time} {a.clientName}
                      </span>
                    </p>
                  ))}
                  {dayAppointments.length > 3 && (
                    <p className="text-[11px] text-ink-muted px-1.5">+{dayAppointments.length - 3} más</p>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  current,
  today,
  getDayAppointments,
  onSelect,
  draggedId,
  onDragStart,
  onDragEnd,
  onDropDay,
}: {
  current: Date;
  today: Date;
  getDayAppointments: (d: Date) => Appointment[];
  onSelect: (a: Appointment) => void;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropDay: (id: string, day: Date) => void;
}) {
  const start = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((d) => {
        const isToday = isSameDay(d, today);
        const dayAppointments = getDayAppointments(d);
        return (
          <div
            key={d.toISOString()}
            className="min-w-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedId) onDropDay(draggedId, d);
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">{DAYS_ES[d.getDay()]}</span>
              <span
                className={`text-xs font-medium w-5 h-5 rounded-full inline-flex items-center justify-center ${
                  isToday ? "bg-accent text-white" : "text-ink"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
            <div className="space-y-1.5">
              {dayAppointments.length === 0 && (
                <div className="h-14 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <span className="text-[10px] text-ink-muted">Sin citas</span>
                </div>
              )}
              {dayAppointments.map((a) => (
                <button
                  key={a.id}
                  draggable
                  onDragStart={() => onDragStart(a.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => onSelect(a)}
                  className="w-full text-left bg-surface border border-border rounded-lg p-2 hover:border-accent/40 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <p className="text-[11px] font-medium tabular text-ink-secondary">{a.time}</p>
                  <p className="text-xs font-medium truncate">{a.clientName}</p>
                  <p className="text-[11px] text-ink-muted truncate">{a.service}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
