"use client";

import { useState, useEffect } from "react";
import { Modal, FieldLabel, inputClass } from "@/components/ui";
import { getAvailableSlotsAction } from "@/lib/actions";
import { formatSpanishDate, toISODate } from "@/lib/dates";
import { PROFESSIONALS, type Appointment, type Client } from "@/lib/types";

const OTHER_OPTION = "__other__";

export function NewAppointmentModal({
  open,
  onClose,
  clients,
  onCreate,
  defaultDateISO,
  lockedClient,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onCreate: (a: Appointment) => void;
  defaultDateISO?: string;
  lockedClient?: Client;
}) {
  const [clientChoice, setClientChoice] = useState(lockedClient?.id ?? clients[0]?.id ?? OTHER_OPTION);
  const [otherName, setOtherName] = useState("");
  const [service, setService] = useState("");
  const [professionalName, setProfessionalName] = useState(PROFESSIONALS[0].name);
  const [dateISO, setDateISO] = useState(() => defaultDateISO ?? toISODate(new Date()));
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDateISO(defaultDateISO ?? toISODate(new Date()));
    if (lockedClient) setClientChoice(lockedClient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDateISO, lockedClient?.id]);

  useEffect(() => {
    if (!open || !dateISO) return;
    let cancelled = false;
    setLoadingSlots(true);
    setTime("");
    getAvailableSlotsAction(dateISO)
      .then((available) => {
        if (cancelled) return;
        setSlots(available);
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
  }, [open, dateISO]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isOther = clientChoice === OTHER_OPTION;
    const client = isOther ? null : clients.find((c) => c.id === clientChoice) ?? null;
    const clientName = isOther ? otherName.trim() : client?.name ?? "";
    if (!clientName || !dateISO || !time) return;

    const [y, m, d] = dateISO.split("-").map(Number);
    const dateLabel = formatSpanishDate(new Date(y, m - 1, d));
    const professional = PROFESSIONALS.find((p) => p.name === professionalName) ?? PROFESSIONALS[0];

    onCreate({
      id: `new-${Date.now()}`,
      time,
      date: dateLabel,
      clientId: client?.id ?? null,
      clientName,
      service: service.trim() || "Consulta",
      status: "Confirmada",
      professionalName: professional.name,
      professionalRole: professional.role,
    });

    setOtherName("");
    setService("");
    setProfessionalName(PROFESSIONALS[0].name);
    setDateISO(toISODate(new Date()));
    setTime("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva cita">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <FieldLabel>Paciente</FieldLabel>
          {lockedClient ? (
            <p className={`${inputClass} bg-plane`}>{lockedClient.name}</p>
          ) : (
            <select value={clientChoice} onChange={(e) => setClientChoice(e.target.value)} className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={OTHER_OPTION}>Otro paciente…</option>
            </select>
          )}
        </div>
        {!lockedClient && clientChoice === OTHER_OPTION && (
          <div>
            <FieldLabel>Nombre del paciente</FieldLabel>
            <input required value={otherName} onChange={(e) => setOtherName(e.target.value)} className={inputClass} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Servicio</FieldLabel>
            <input value={service} onChange={(e) => setService(e.target.value)} className={inputClass} placeholder="Revisión general" />
          </div>
          <div>
            <FieldLabel>Profesional</FieldLabel>
            <select value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} className={inputClass}>
              {PROFESSIONALS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <input required type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Hora</FieldLabel>
            <select required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} disabled={loadingSlots || slots.length === 0}>
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
        <button
          type="submit"
          disabled={!time}
          className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Crear cita
        </button>
      </form>
    </Modal>
  );
}
