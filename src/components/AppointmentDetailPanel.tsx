"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  CalendarClock,
  XCircle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  History,
  Pencil,
} from "lucide-react";
import { StatusBadge, FieldLabel, inputClass } from "@/components/ui";
import { getAvailableSlotsAction } from "@/lib/actions";
import { parseSpanishDate, formatSpanishDate, toISODate } from "@/lib/dates";
import { PROFESSIONALS, type Appointment, type Client } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const STATUS_TONE: Record<string, { bg: string; text: string }> = {
  Confirmada: { bg: "bg-good-bg", text: "text-good" },
  Modificada: { bg: "bg-accent-light", text: "text-accent" },
  Completada: { bg: "bg-good-bg", text: "text-good" },
  Cancelada: { bg: "bg-critical-bg", text: "text-critical" },
};

function InfoRow({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: { bg: string; text: string };
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.bg}`}>
        <Icon size={16} className={tone.text} />
      </span>
      <span className="text-xs text-ink-muted flex-1">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

export function AppointmentDetailPanel({
  appointment,
  patient,
  onClose,
  onCancel,
  onReschedule,
  onSetStatus,
  onUpdateDetails,
}: {
  appointment: Appointment;
  patient: Client | null;
  onClose: () => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string, date: string, time: string) => void;
  onSetStatus: (id: string, status: Appointment["status"]) => void;
  onUpdateDetails: (id: string, patch: { service: string; professionalName: string; professionalRole: string }) => void;
}) {
  const [mode, setMode] = useState<"view" | "reschedule" | "edit">("view");
  const [newDateISO, setNewDateISO] = useState(() => toISODate(parseSpanishDate(appointment.date)));
  const [newTime, setNewTime] = useState(appointment.time);
  const [slots, setSlots] = useState<string[]>([appointment.time]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editService, setEditService] = useState(appointment.service);
  const [editProfessional, setEditProfessional] = useState(appointment.professionalName);

  useEffect(() => {
    setMode("view");
    setNewDateISO(toISODate(parseSpanishDate(appointment.date)));
    setNewTime(appointment.time);
    setEditService(appointment.service);
    setEditProfessional(appointment.professionalName);
  }, [appointment.id, appointment.date, appointment.time, appointment.service, appointment.professionalName]);

  useEffect(() => {
    if (mode !== "reschedule") return;
    let cancelled = false;
    setLoadingSlots(true);
    getAvailableSlotsAction(newDateISO)
      .then((available) => {
        if (cancelled) return;
        const sameDay = newDateISO === toISODate(parseSpanishDate(appointment.date));
        const withCurrent = sameDay && !available.includes(appointment.time) ? [appointment.time, ...available].sort() : available;
        setSlots(withCurrent);
        setLoadingSlots(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, newDateISO, appointment.date, appointment.time]);

  function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!newTime) return;
    const [y, m, d] = newDateISO.split("-").map(Number);
    onReschedule(appointment.id, formatSpanishDate(new Date(y, m - 1, d)), newTime);
    setMode("view");
    onClose();
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const professional = PROFESSIONALS.find((p) => p.name === editProfessional) ?? PROFESSIONALS[0];
    onUpdateDetails(appointment.id, {
      service: editService.trim() || appointment.service,
      professionalName: professional.name,
      professionalRole: professional.role,
    });
    setMode("view");
  }

  const statusTone = STATUS_TONE[appointment.status] ?? { bg: "bg-plane", text: "text-ink-secondary" };
  const canResolve = appointment.status !== "Cancelada" && appointment.status !== "Completada";
  const isSample = appointment.id.startsWith("sample-");

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-surface border-l border-border shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <h2 className="font-semibold">Detalle de la cita</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 pb-4 mb-1 border-b border-border">
            <span className="w-11 h-11 rounded-full bg-accent-light flex items-center justify-center text-sm font-semibold text-accent shrink-0">
              {initials(appointment.clientName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{appointment.clientName}</p>
              {patient && <p className="text-xs text-ink-muted truncate">{patient.phone}</p>}
            </div>
            {patient && (
              <Link
                href={`/pacientes/${patient.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline shrink-0"
              >
                Ver paciente
                <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {mode === "edit" ? (
            <form onSubmit={handleEditSubmit} className="py-4 space-y-3">
              <div>
                <FieldLabel>Motivo</FieldLabel>
                <input value={editService} onChange={(e) => setEditService(e.target.value)} className={inputClass} />
              </div>
              <div>
                <FieldLabel>Profesional</FieldLabel>
                <select value={editProfessional} onChange={(e) => setEditProfessional(e.target.value)} className={inputClass}>
                  {PROFESSIONALS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="flex-1 px-4 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-plane transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150"
                >
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div>
              <InfoRow icon={Calendar} tone={{ bg: "bg-accent-light", text: "text-accent" }} label="Fecha">
                {appointment.date}
              </InfoRow>
              <InfoRow icon={Clock} tone={{ bg: "bg-violet-bg", text: "text-violet" }} label="Hora">
                {appointment.time}
              </InfoRow>
              <InfoRow icon={FileText} tone={{ bg: "bg-warning-bg", text: "text-[#946200]" }} label="Motivo">
                {appointment.service}
              </InfoRow>
              <div className="flex items-center gap-3 py-3 border-b border-border">
                <span className="w-9 h-9 rounded-full bg-teal-bg flex items-center justify-center text-xs font-semibold text-teal shrink-0">
                  {initials(appointment.professionalName)}
                </span>
                <span className="text-xs text-ink-muted flex-1">Profesional</span>
                <span className="text-right">
                  <span className="block text-sm font-medium">{appointment.professionalName}</span>
                  <span className="block text-xs text-ink-muted">{appointment.professionalRole}</span>
                </span>
              </div>
              <InfoRow icon={CheckCircle2} tone={statusTone} label="Estado">
                <StatusBadge status={appointment.status} />
              </InfoRow>
              {appointment.createdAt && (
                <InfoRow icon={History} tone={{ bg: "bg-plane", text: "text-ink-muted" }} label="Creada el">
                  {new Date(appointment.createdAt).toLocaleString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </InfoRow>
              )}
            </div>
          )}

          {mode === "reschedule" && (
            <form onSubmit={handleReschedule} className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Nueva fecha y hora</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Fecha</FieldLabel>
                  <input
                    required
                    type="date"
                    value={newDateISO}
                    onChange={(e) => {
                      setNewDateISO(e.target.value);
                      setNewTime("");
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Hora</FieldLabel>
                  <select
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className={inputClass}
                    disabled={loadingSlots || slots.length === 0}
                  >
                    <option value="" disabled>
                      {loadingSlots ? "Buscando horas libres…" : slots.length === 0 ? "Sin horas libres este día" : "Elige una hora"}
                    </option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="flex-1 px-4 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-plane transition-colors"
                >
                  Cancelar cambio
                </button>
                <button
                  type="submit"
                  disabled={!newTime}
                  className="flex-1 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </form>
          )}
        </div>

        {mode === "view" && isSample && (
          <div className="p-5 border-t border-border shrink-0">
            <p className="text-xs text-ink-muted text-center">
              Cita de ejemplo, solo para previsualizar la agenda. No se puede editar.
            </p>
          </div>
        )}

        {mode === "view" && !isSample && (
          <div className="p-5 border-t border-border shrink-0 space-y-2">
            <button
              onClick={() => setMode("edit")}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl bg-accent text-white shadow-sm hover:opacity-90 transition-all duration-150"
            >
              <Pencil size={15} />
              Editar cita
            </button>
            <button
              onClick={() => setMode("reschedule")}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-border hover:bg-plane transition-colors"
            >
              <CalendarClock size={15} />
              Reagendar
            </button>
            {canResolve && (
              <button
                onClick={() => {
                  onSetStatus(appointment.id, "Completada");
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-good/30 text-good hover:bg-good-bg transition-colors"
              >
                <CheckCircle2 size={15} />
                Marcar como Completada
              </button>
            )}
            <button
              onClick={() => {
                onCancel(appointment.id);
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-border text-critical hover:bg-critical-bg transition-colors"
            >
              <XCircle size={15} />
              Cancelar cita
            </button>
          </div>
        )}
      </div>
    </>
  );
}
