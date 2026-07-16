import { supabaseAdmin } from "@/lib/supabase-server";
import { appointmentDateTime, formatSpanishDate } from "@/lib/dates";
import type { Client, Invoice, Quote, Appointment, HistoryActivity, PipelineCard } from "@/lib/types";

export * from "@/lib/types";

export const COMPANY_NAME = "MompoStudio OS";

// próxima cita / última visita se calculan en vivo comparando con la hora actual,
// en vez de guardarse fijas: así una cita confirmada que ya pasó deja de contar
// como "próxima" sin que nadie tenga que marcarla manualmente.
function computeVisitFields(clientAppointments: Appointment[]): { nextAppointment: string | null; lastVisit: string } {
  const now = Date.now();
  const active = clientAppointments.filter((a) => a.status !== "Cancelada");
  const future = active
    .filter((a) => appointmentDateTime(a).getTime() > now)
    .sort((a, b) => appointmentDateTime(a).getTime() - appointmentDateTime(b).getTime());
  const past = active
    .filter((a) => appointmentDateTime(a).getTime() <= now)
    .sort((a, b) => appointmentDateTime(b).getTime() - appointmentDateTime(a).getTime());

  return {
    nextAppointment: future[0] ? `${future[0].date} · ${future[0].time}` : null,
    lastVisit: past[0] ? past[0].date : "—",
  };
}

function mapPatient(row: Record<string, unknown>, appointmentsForClient: Appointment[] = []): Client {
  const { nextAppointment, lastVisit } = computeVisitFields(appointmentsForClient);
  return {
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    birthDate: (row.birth_date as string) ?? "",
    notes: (row.notes as string) ?? "",
    lastVisit,
    nextAppointment,
    status: row.status as Client["status"],
    channel: (row.channel as string) ?? "",
    appointments: (row.appointments as Client["appointments"]) ?? [],
    treatments: (row.treatments as Client["treatments"]) ?? [],
    cancellations: (row.cancellations as Client["cancellations"]) ?? [],
    reviews: (row.reviews as Client["reviews"]) ?? [],
    timeline: (row.timeline as Client["timeline"]) ?? [],
    medicalInfo: row.medical_info as Client["medicalInfo"],
    clinicalNotes: (row.clinical_notes as Client["clinicalNotes"]) ?? [],
    documents: (row.documents as Client["documents"]) ?? [],
  };
}

const DATE_FORMAT_ES = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Madrid",
});
const TIME_FORMAT_ES = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Madrid",
});

function mapAppointment(row: Record<string, unknown>): Appointment {
  const startsAt = row.starts_at ? new Date(row.starts_at as string) : null;
  return {
    id: row.id as string,
    time: startsAt ? TIME_FORMAT_ES.format(startsAt) : (row.time as string),
    date: startsAt ? DATE_FORMAT_ES.format(startsAt).replace(".", "") : (row.date as string),
    clientId: (row.client_id as string) ?? null,
    clientName: row.client_name as string,
    service: (row.service as string) ?? "",
    status: row.status as Appointment["status"],
    professionalName: (row.professional_name as string) ?? "Pau Camps",
    professionalRole: (row.professional_role as string) ?? "Odontología general",
    createdAt: (row.created_at as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    eventIdGoogle: (row.event_id_google as string) ?? undefined,
    startsAt: (row.starts_at as string) ?? undefined,
  };
}

function mapQuote(row: Record<string, unknown>): Quote {
  return {
    id: row.id as string,
    date: row.date as string,
    clientId: (row.client_id as string) ?? null,
    clientName: row.client_name as string,
    concept: (row.concept as string) ?? "",
    amount: Number(row.amount),
    status: row.status as Quote["status"],
    validUntil: (row.valid_until as string) ?? "",
    treatmentStatus: (row.treatment_status as Quote["treatmentStatus"]) ?? "Pendiente",
  };
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    date: row.date as string,
    clientId: (row.client_id as string) ?? null,
    clientName: row.client_name as string,
    concept: (row.concept as string) ?? "",
    amount: Number(row.amount),
    method: row.method as Invoice["method"],
    insurer: (row.insurer as string) ?? undefined,
    status: row.status as Invoice["status"],
  };
}

function mapPipelineCard(row: Record<string, unknown>): PipelineCard {
  return {
    id: row.id as string,
    stageId: row.stage_id as string,
    clientName: row.client_name as string,
    clientId: (row.client_id as string) ?? null,
    detail: (row.detail as string) ?? "",
    updated: (row.updated as string) ?? "",
    reminders: (row.reminders as PipelineCard["reminders"]) ?? undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const [{ data, error }, appointments] = await Promise.all([
    supabaseAdmin.from("patients").select("*").order("created_at", { ascending: true }),
    getAllAppointments(),
  ]);
  if (error) throw error;

  const byClient = new Map<string, Appointment[]>();
  for (const a of appointments) {
    if (!a.clientId) continue;
    if (!byClient.has(a.clientId)) byClient.set(a.clientId, []);
    byClient.get(a.clientId)!.push(a);
  }

  return (data ?? []).map((row) => mapPatient(row, byClient.get(row.id as string) ?? []));
}

export async function getClientById(id: string): Promise<Client | null> {
  const [{ data, error }, { data: appointmentRows, error: apptError }] = await Promise.all([
    supabaseAdmin.from("patients").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("appointments").select("*").eq("client_id", id),
  ]);
  if (error) throw error;
  if (apptError) throw apptError;
  if (!data) return null;

  return mapPatient(data, (appointmentRows ?? []).map(mapAppointment));
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabaseAdmin.from("appointments").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function getHistoryActivities(): Promise<HistoryActivity[]> {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select("time, label, created_at, event_type, entity_type, entity_id, actor_name")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    time: row.time,
    label: row.label,
    createdAt: row.created_at,
    eventType: row.event_type ?? undefined,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    actorName: row.actor_name ?? undefined,
  }));
}

export interface AutomationView {
  name: string;
  description: string;
  status: "Activo" | "Disponible";
}

async function getN8nWorkflowStatuses(): Promise<Record<string, boolean>> {
  const apiUrl = process.env.N8N_API_URL;
  const apiKey = process.env.N8N_API_KEY;
  if (!apiUrl || !apiKey) return {};
  try {
    const res = await fetch(`${apiUrl}/workflows?limit=50`, {
      headers: { "X-N8N-API-KEY": apiKey },
      cache: "no-store",
    });
    if (!res.ok) return {};
    const json = await res.json();
    const map: Record<string, boolean> = {};
    for (const w of json.data ?? []) {
      map[w.name] = !!w.active;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getAutomationsView(): Promise<AutomationView[]> {
  const wf = await getN8nWorkflowStatuses();
  const whatsappActive = !!wf["usar este"];
  const calendarActive = !!wf["Ver Disponibilidad (Interno)"] && !!wf["Sincronizar Panel <-> Google Calendar"];
  const remindersActive = !!wf["recordatorio citas"];

  return [
    {
      name: "WhatsApp IA",
      description: "Responde y agenda citas por WhatsApp 24/7, sin que tengas que estar pendiente del móvil.",
      status: whatsappActive ? "Activo" : "Disponible",
    },
    {
      name: "IA Conversacional",
      description: "El mismo asistente resuelve dudas frecuentes del negocio (horarios, precios, ubicación) sin intervención humana.",
      status: whatsappActive ? "Activo" : "Disponible",
    },
    {
      name: "Google Calendar",
      description: "Bloquea huecos automáticamente para que nunca se solape una cita con otra.",
      status: calendarActive ? "Activo" : "Disponible",
    },
    {
      name: "Recordatorios",
      description: "Avisos automáticos 24h y 1h antes de cada cita, para reducir las ausencias.",
      status: remindersActive ? "Activo" : "Disponible",
    },
    {
      name: "Seguimientos",
      description: "Contacta al paciente tras la visita para cuidar la relación y detectar problemas a tiempo.",
      status: "Disponible",
    },
    {
      name: "Valoraciones",
      description: "Pide una reseña por WhatsApp justo después de la cita, cuando la experiencia está más fresca.",
      status: "Disponible",
    },
    {
      name: "Reactivación",
      description: "Detecta pacientes inactivos y les manda un mensaje automático para que vuelvan.",
      status: "Disponible",
    },
  ];
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabaseAdmin.from("invoices").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapInvoice);
}

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapQuote);
}

export async function getPipelineCards(): Promise<PipelineCard[]> {
  const { data, error } = await supabaseAdmin.from("pipeline_cards").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPipelineCard);
}
