"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, CalendarDays, Users, Clock } from "lucide-react";
import { DAYS_ES_MON_FIRST, MONTHS_LONG_ES, getMonthGridDays, isSameDay } from "@/lib/dates";
import { PROFESSIONALS, type Appointment } from "@/lib/types";

const PROFESSIONAL_ACCENT = ["bg-accent", "bg-violet", "bg-teal", "bg-warning", "bg-good"];

function toneForProfessional(name: string) {
  const i = PROFESSIONALS.findIndex((p) => p.name === name);
  return PROFESSIONAL_ACCENT[i >= 0 ? i % PROFESSIONAL_ACCENT.length : 0];
}

export function AgendaSidebar({
  miniMonth,
  onMiniMonthChange,
  selectedDay,
  onSelectDay,
  today,
  getDayAppointments,
}: {
  miniMonth: Date;
  onMiniMonthChange: (d: Date) => void;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  today: Date;
  getDayAppointments: (d: Date) => Appointment[];
}) {
  const days = getMonthGridDays(miniMonth);
  const todaysAppointments = getDayAppointments(today).sort((a, b) => a.time.localeCompare(b.time));
  const selectedDayAppointments = getDayAppointments(selectedDay);
  const uniquePatients = new Set(selectedDayAppointments.map((a) => a.clientId ?? a.clientName)).size;
  const totalMinutes = selectedDayAppointments.length * 30;
  const totalHoursLabel =
    totalMinutes === 0 ? "0h" : totalMinutes % 60 === 0 ? `${totalMinutes / 60}h` : `${(totalMinutes / 60).toFixed(1)}h`;

  return (
    <div className="w-full lg:w-72 lg:shrink-0 space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">
            {MONTHS_LONG_ES[miniMonth.getMonth()].charAt(0).toUpperCase() + MONTHS_LONG_ES[miniMonth.getMonth()].slice(1)}{" "}
            {miniMonth.getFullYear()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMiniMonthChange(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1))}
              className="p-1 rounded-md hover:bg-plane transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onMiniMonthChange(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1))}
              className="p-1 rounded-md hover:bg-plane transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS_ES_MON_FIRST.map((d) => (
            <div key={d} className="text-[10px] font-medium text-ink-muted text-center py-1">
              {d.charAt(0)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === miniMonth.getMonth();
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDay);
            return (
              <button
                key={i}
                onClick={() => onSelectDay(d)}
                className="flex items-center justify-center"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                    isSelected
                      ? "bg-accent text-white font-semibold"
                      : isToday
                        ? "text-accent font-semibold"
                        : inMonth
                          ? "text-ink hover:bg-plane"
                          : "text-ink-muted/50 hover:bg-plane"
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Agenda de hoy</p>
          <span className="text-xs text-ink-muted">{todaysAppointments.length} citas</span>
        </div>
        {todaysAppointments.length === 0 ? (
          <p className="text-xs text-ink-muted">No hay citas hoy.</p>
        ) : (
          <div className="space-y-2.5 mb-3">
            {todaysAppointments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <span className={`w-1 self-stretch rounded-full shrink-0 ${toneForProfessional(a.professionalName)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.clientName}</p>
                  <p className="text-xs text-ink-muted truncate">{a.professionalName}</p>
                </div>
                <span className="text-xs text-ink-muted tabular shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/citas" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          Ver todas las citas de hoy
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3">Resumen del día</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
              <CalendarDays size={15} className="text-accent" />
            </span>
            <span className="text-xs text-ink-muted flex-1">Citas</span>
            <span className="text-sm font-semibold">{selectedDayAppointments.length}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-violet-bg flex items-center justify-center shrink-0">
              <Users size={15} className="text-violet" />
            </span>
            <span className="text-xs text-ink-muted flex-1">Pacientes</span>
            <span className="text-sm font-semibold">{uniquePatients}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-good-bg flex items-center justify-center shrink-0">
              <Clock size={15} className="text-good" />
            </span>
            <span className="text-xs text-ink-muted flex-1">Duración total</span>
            <span className="text-sm font-semibold">{totalHoursLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
