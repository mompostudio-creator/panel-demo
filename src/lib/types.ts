// El resto de matices (nuevo lead, en seguimiento, presupuesto pendiente,
// para reactivar...) ya los lleva el Pipeline. Este campo solo distingue si
// el paciente está activo en la clínica o no.
export const CLIENT_STATUSES = ["Activo", "Inactivo"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  notes: string;
  lastVisit: string;
  nextAppointment: string | null;
  status: ClientStatus;
  channel: string;
  appointments: { date: string; service: string; status: string }[];
  treatments: { date: string; label: string }[];
  cancellations: { date: string; reason: string }[];
  reviews: { date: string; rating: number; comment: string }[];
  timeline: { date: string; label: string }[];
  medicalInfo: { allergies: string; conditions: string; medications: string };
  clinicalNotes: { date: string; author: string; note: string }[];
  documents: { name: string; date: string; type: string }[];
}

export interface Invoice {
  id: string;
  date: string;
  clientId: string | null;
  clientName: string;
  concept: string;
  amount: number;
  method: "Efectivo" | "Tarjeta" | "Seguro" | "Financiado";
  insurer?: string;
  status: "Pagada" | "Pendiente";
}

export interface Quote {
  id: string;
  date: string;
  clientId: string | null;
  clientName: string;
  concept: string;
  amount: number;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  validUntil: string;
  // Solo tiene sentido una vez el presupuesto está Aprobado: si el tratamiento
  // en sí ya se ha llevado a cabo. Lo marca la clínica a mano.
  treatmentStatus: "Pendiente" | "Realizado";
}

export interface Appointment {
  id: string;
  time: string;
  date: string;
  clientId: string | null;
  clientName: string;
  service: string;
  status: "Confirmada" | "Cancelada" | "Modificada" | "Completada";
  professionalName: string;
  professionalRole: string;
  notes?: string;
  eventIdGoogle?: string;
  startsAt?: string;
  createdAt?: string;
}

export interface Professional {
  name: string;
  role: string;
}

// Equipo de la clínica. En una implementación real esto vendría de una tabla
// de usuarios/staff; aquí es una lista fija. Los 3 últimos son de prueba,
// añadidos solo para ver cómo se ve la agenda con más columnas.
export const PROFESSIONALS: Professional[] = [
  { name: "Pau Camps", role: "Odontología general" },
  { name: "Isabel Ferrer", role: "Higiene dental" },
  { name: "Marta Ruiz", role: "Ortodoncia" },
  { name: "Álvaro Costa", role: "Implantología" },
  { name: "Nuria Sole", role: "Odontopediatría" },
];

export interface HistoryActivity {
  time: string;
  label: string;
  createdAt: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorName?: string;
}

export interface Automation {
  name: string;
  status: "Activo" | "Sincronizado" | "Pausado";
  description: string;
}

export interface PipelineStage {
  id: string;
  emoji: string;
  label: string;
}

export interface PipelineCard {
  id: string;
  stageId: string;
  clientName: string;
  clientId: string | null;
  detail: string;
  updated: string;
  reminders?: { h24: boolean; h1: boolean };
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "nuevo-lead", emoji: "🟦", label: "Nuevo lead" },
  { id: "visita-agendada", emoji: "🟪", label: "Visita agendada" },
  { id: "diagnostico", emoji: "🟨", label: "Diagnóstico realizado" },
  { id: "presupuesto-enviado", emoji: "🟧", label: "Presupuesto enviado" },
  { id: "en-seguimiento", emoji: "🟠", label: "En seguimiento" },
  { id: "aceptado", emoji: "🟢", label: "Aceptado" },
  { id: "tratamiento-en-curso", emoji: "🔵", label: "Tratamiento en curso" },
  { id: "finalizado", emoji: "✅", label: "Finalizado" },
  { id: "perdido", emoji: "🔴", label: "Perdido" },
];
