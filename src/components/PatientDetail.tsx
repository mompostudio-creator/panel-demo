"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  ShieldAlert,
  Stethoscope,
  Pill,
  FileText,
  Paperclip,
  Plus,
  Check,
  X as XIcon,
  HeartPulse,
  CalendarClock,
  XCircle,
} from "lucide-react";
import { Card, StatusBadge, RowInput, Modal, FieldLabel, inputClass } from "@/components/ui";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { useAppData } from "@/lib/store";
import { appointmentDateTime } from "@/lib/dates";

export function PatientDetail({ clientId }: { clientId: string }) {
  const { clients, updateClient, quotes, addQuote, setQuoteStatus, setTreatmentStatus, appointments, addAppointment, cancelAppointment } =
    useAppData();
  const client = clients.find((c) => c.id === clientId);
  const [noteOpen, setNoteOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [newApptOpen, setNewApptOpen] = useState(false);

  if (!client) {
    return (
      <div className="max-w-5xl">
        <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6">
          <ArrowLeft size={15} />
          Volver a pacientes
        </Link>
        <p className="text-sm text-ink-muted">Este paciente ya no existe.</p>
      </div>
    );
  }

  const patientQuotes = quotes.filter((q) => q.clientId === client.id);
  const allPatientAppointments = appointments
    .filter((a) => a.clientId === client.id)
    .slice()
    .sort((a, b) => appointmentDateTime(b).getTime() - appointmentDateTime(a).getTime());
  // Se queda en "Citas" hasta que alguien la resuelva (Completada o
  // Cancelada), no simplemente porque haya pasado su hora — igual que en la
  // pantalla de Citas.
  const patientAppointments = allPatientAppointments
    .filter((a) => a.status !== "Cancelada" && a.status !== "Completada")
    .slice()
    .reverse();

  function addNote(note: string) {
    updateClient(client!.id, {
      clinicalNotes: [{ date: "Ahora", author: "Tú", note }, ...client!.clinicalNotes],
    });
  }

  function addDocument(name: string, type: string) {
    updateClient(client!.id, {
      documents: [{ name, type, date: "Ahora" }, ...client!.documents],
    });
  }

  function proposeTreatment(name: string, price: number) {
    addQuote({
      date: "Ahora",
      clientId: client!.id,
      clientName: client!.name,
      concept: name,
      amount: price,
      validUntil: "30 días",
    });
  }

  return (
    <div className="max-w-5xl">
      <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6">
        <ArrowLeft size={15} />
        Volver a pacientes
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="text-sm text-ink-secondary mt-1">Paciente desde {client.channel}</p>
        </div>
        {client.nextAppointment && (
          <Card className="px-4 py-3">
            <p className="text-xs text-ink-muted">Próxima cita</p>
            <p className="text-sm font-semibold mt-0.5">{client.nextAppointment}</p>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Información</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-ink-secondary">
              <Phone size={15} className="shrink-0" />
              <RowInput value={client.phone} onChange={(v) => updateClient(client.id, { phone: v })} className="flex-1" />
            </div>
            <div className="flex items-center gap-2.5 text-ink-secondary">
              <Mail size={15} className="shrink-0" />
              <RowInput value={client.email} onChange={(v) => updateClient(client.id, { email: v })} className="flex-1" />
            </div>
            <div className="flex items-center gap-2.5 text-ink-secondary">
              <Cake size={15} className="shrink-0" />
              <RowInput value={client.birthDate} onChange={(v) => updateClient(client.id, { birthDate: v })} className="flex-1" />
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs font-medium text-ink-muted mb-1.5">Notas</p>
            <textarea
              rows={3}
              value={client.notes}
              onChange={(e) => updateClient(client.id, { notes: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h2 className="font-semibold mb-4">Reseñas y cancelaciones</h2>
          <p className="text-xs text-ink-muted mb-4">
            Las citas activas están en la sección "Citas" más abajo. Aquí solo quedan valoraciones y motivos de cancelaciones pasadas.
          </p>
          <div className="space-y-2">
            {client.cancellations.length === 0 && client.reviews.length === 0 && (
              <p className="text-sm text-ink-muted">Sin reseñas ni cancelaciones registradas.</p>
            )}
            {client.cancellations.map((c, i) => (
              <div key={`cancel-${i}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">Cancelación · {c.reason}</p>
                  <p className="text-xs text-ink-muted">{c.date}</p>
                </div>
                <StatusBadge status="Cancelada" />
              </div>
            ))}
            {client.reviews.map((r, i) => (
              <div key={`review-${i}`} className="py-2 border-b border-border last:border-0">
                <p className="text-sm font-medium">
                  Valoración · {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </p>
                <p className="text-xs text-ink-secondary mt-0.5">{r.comment}</p>
                <p className="text-xs text-ink-muted mt-0.5">{r.date}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarClock size={16} className="text-ink-muted" />
            Citas
          </h2>
          <button
            onClick={() => setNewApptOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Plus size={13} />
            Pedir cita
          </button>
        </div>
        {patientAppointments.length === 0 ? (
          <p className="text-sm text-ink-muted">Sin citas próximas.</p>
        ) : (
          <div className="space-y-2">
            {patientAppointments.map((a) => {
              const isOverdue = appointmentDateTime(a).getTime() < Date.now();
              return (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {a.date} · {a.time}
                    </p>
                    <p className="text-xs text-ink-muted">{a.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={isOverdue ? "Vencida" : a.status} />
                    <button
                      onClick={() => cancelAppointment(a.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-critical hover:underline"
                    >
                      <XCircle size={13} />
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Stethoscope size={16} className="text-ink-muted" />
          Historial completo
        </h2>
        <p className="text-xs text-ink-muted mb-4">Todas las citas del paciente, incluidas pasadas y canceladas.</p>
        {allPatientAppointments.length === 0 ? (
          <p className="text-sm text-ink-muted">Sin citas registradas todavía.</p>
        ) : (
          <div className="space-y-2">
            {allPatientAppointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {a.date} · {a.time}
                  </p>
                  <p className="text-xs text-ink-muted">{a.service}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <HeartPulse size={16} className="text-ink-muted" />
            Tratamientos
          </h2>
          <p className="text-xs text-ink-muted mb-4">
            Proponer uno crea automáticamente un presupuesto. Al aprobarlo, se genera la factura sola.
          </p>
          {patientQuotes.length === 0 ? (
            <p className="text-sm text-ink-muted mb-3">Sin tratamientos propuestos.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {patientQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{q.concept}</p>
                    <p className="text-xs text-ink-muted tabular">{q.amount}€</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {q.status === "Pendiente" && (
                      <>
                        <button
                          onClick={() => setQuoteStatus(q.id, "Aprobado")}
                          className="inline-flex items-center gap-1 text-xs font-medium text-good hover:underline"
                        >
                          <Check size={13} />
                          Aprobar
                        </button>
                        <button
                          onClick={() => setQuoteStatus(q.id, "Rechazado")}
                          className="inline-flex items-center gap-1 text-xs font-medium text-critical hover:underline"
                        >
                          <XIcon size={13} />
                          Rechazar
                        </button>
                      </>
                    )}
                    {q.status === "Aprobado" && (
                      <button
                        onClick={() => setTreatmentStatus(q.id, q.treatmentStatus === "Realizado" ? "Pendiente" : "Realizado")}
                        title="Marcar el tratamiento como realizado o pendiente"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <StatusBadge status={q.treatmentStatus} />
                      </button>
                    )}
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setTreatmentOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Plus size={13} />
            Proponer tratamiento
          </button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-ink-muted" />
            Información clínica
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Alergias</p>
              <RowInput
                value={client.medicalInfo.allergies}
                onChange={(v) => updateClient(client.id, { medicalInfo: { ...client.medicalInfo, allergies: v } })}
                className="w-full"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Antecedentes</p>
              <RowInput
                value={client.medicalInfo.conditions}
                onChange={(v) => updateClient(client.id, { medicalInfo: { ...client.medicalInfo, conditions: v } })}
                className="w-full"
              />
            </div>
            <div className="flex items-start gap-1.5">
              <Pill size={14} className="text-ink-muted shrink-0 mt-2" />
              <div className="flex-1">
                <p className="text-xs font-medium text-ink-muted mb-0.5">Medicación</p>
                <RowInput
                  value={client.medicalInfo.medications}
                  onChange={(v) => updateClient(client.id, { medicalInfo: { ...client.medicalInfo, medications: v } })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Stethoscope size={16} className="text-ink-muted" />
            Notas clínicas
          </h2>
          {client.clinicalNotes.length === 0 ? (
            <p className="text-sm text-ink-muted mb-3">Sin notas todavía.</p>
          ) : (
            <div className="space-y-3 mb-3">
              {client.clinicalNotes.map((n, i) => (
                <div key={i} className="pb-3 border-b border-border last:border-0 last:pb-0">
                  <p className="text-sm text-ink-secondary">{n.note}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    {n.author} · {n.date}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setNoteOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Plus size={13} />
            Añadir nota
          </button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-ink-muted" />
            Documentos
          </h2>
          {client.documents.length === 0 ? (
            <p className="text-sm text-ink-muted mb-3">Sin documentos adjuntos.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {client.documents.map((d, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <Paperclip size={14} className="text-ink-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{d.name}</p>
                    <p className="text-xs text-ink-muted">
                      {d.type} · {d.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setDocOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Plus size={13} />
            Añadir documento
          </button>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h2 className="font-semibold mb-4">Actividad del paciente</h2>
        <div className="space-y-3">
          {client.timeline.map((t, i) => (
            <div key={i} className="flex gap-4 text-sm">
              <span className="text-ink-muted tabular shrink-0 w-32">{t.date}</span>
              <span className="text-ink-secondary">{t.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <AddNoteModal open={noteOpen} onClose={() => setNoteOpen(false)} onAdd={addNote} />
      <AddDocumentModal open={docOpen} onClose={() => setDocOpen(false)} onAdd={addDocument} />
      <ProposeTreatmentModal open={treatmentOpen} onClose={() => setTreatmentOpen(false)} onPropose={proposeTreatment} />
      <NewAppointmentModal
        open={newApptOpen}
        onClose={() => setNewApptOpen(false)}
        clients={[client]}
        lockedClient={client}
        onCreate={addAppointment}
      />
    </div>
  );
}

function AddNoteModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (note: string) => void }) {
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    onAdd(note.trim());
    setNote("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Añadir nota clínica">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <FieldLabel>Nota</FieldLabel>
          <textarea
            required
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          Añadir nota
        </button>
      </form>
    </Modal>
  );
}

function AddDocumentModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, type: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Informe");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Añadir documento">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <FieldLabel>Nombre del archivo</FieldLabel>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Radiografía.jpg" />
        </div>
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option>Informe</option>
            <option>Radiografía</option>
            <option>Plan</option>
            <option>Consentimiento</option>
            <option>Otro</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          Añadir documento
        </button>
      </form>
    </Modal>
  );
}

function ProposeTreatmentModal({
  open,
  onClose,
  onPropose,
}: {
  open: boolean;
  onClose: () => void;
  onPropose: (name: string, price: number) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onPropose(name.trim(), Number(price) || 0);
    setName("");
    setPrice("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Proponer tratamiento">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <FieldLabel>Tratamiento</FieldLabel>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Ortodoncia completa"
          />
        </div>
        <div>
          <FieldLabel>Importe (€)</FieldLabel>
          <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </div>
        <p className="text-xs text-ink-muted">
          Se creará un presupuesto pendiente de aprobación. Al aprobarlo, se generará la factura automáticamente.
        </p>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          Proponer tratamiento
        </button>
      </form>
    </Modal>
  );
}
