"use client";

import { useState } from "react";
import { Modal, FieldLabel, inputClass } from "@/components/ui";
import type { Client } from "@/lib/types";

const CHANNELS = ["Instagram", "WhatsApp", "Formulario web", "Recomendación", "Otro"];

const emptyForm = { name: "", phone: "", email: "", channel: CHANNELS[0], notes: "" };

export function NewPatientModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: Client) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    onCreate({
      id: `local-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim() || "—",
      email: form.email.trim() || "—",
      birthDate: "—",
      notes: form.notes.trim(),
      lastVisit: "—",
      nextAppointment: null,
      status: "Activo",
      channel: form.channel,
      appointments: [],
      treatments: [],
      cancellations: [],
      reviews: [],
      timeline: [{ date: "Ahora", label: "Paciente añadido manualmente" }],
      medicalInfo: { allergies: "Por confirmar", conditions: "Por confirmar", medications: "Por confirmar" },
      clinicalNotes: [],
      documents: [],
    });

    setForm(emptyForm);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Añadir paciente">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <FieldLabel>Nombre completo</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Canal</FieldLabel>
          <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputClass}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Notas</FieldLabel>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          Añadir paciente
        </button>
      </form>
    </Modal>
  );
}
