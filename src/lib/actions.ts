"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import {
  getClients,
  getQuotes,
  getInvoices,
  getAllAppointments,
  getPipelineCards,
  getHistoryActivities,
} from "@/lib/data";
import { parseSpanishDate } from "@/lib/dates";
import type { Client, Invoice, Quote, Appointment } from "@/lib/types";

// Horario de la clínica: lunes a viernes 09-14 y 16-20, sábados 09-14, domingo cerrado.
const BUSINESS_HOURS: Record<number, [string, string][]> = {
  0: [],
  1: [["09:00", "14:00"], ["16:00", "20:00"]],
  2: [["09:00", "14:00"], ["16:00", "20:00"]],
  3: [["09:00", "14:00"], ["16:00", "20:00"]],
  4: [["09:00", "14:00"], ["16:00", "20:00"]],
  5: [["09:00", "14:00"], ["16:00", "20:00"]],
  6: [["09:00", "14:00"]],
};

function generateSlots(ranges: [string, string][]): string[] {
  const slots: string[] = [];
  for (const [start, end] of ranges) {
    let [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    while (h < eh || (h === eh && m < em)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) {
        m -= 60;
        h += 1;
      }
    }
  }
  return slots;
}

export async function getAvailableSlotsAction(dateISO: string): Promise<string[]> {
  const [y, m, d] = dateISO.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  const allSlots = generateSlots(BUSINESS_HOURS[weekday] ?? []);
  if (allSlots.length === 0) return [];

  const appointments = await getAllAppointments();
  const occupied = new Set(
    appointments
      .filter((a) => a.status !== "Cancelada")
      .filter((a) => {
        const ad = parseSpanishDate(a.date);
        return ad.getFullYear() === y && ad.getMonth() === m - 1 && ad.getDate() === d;
      })
      .map((a) => a.time)
  );

  return allSlots.filter((s) => !occupied.has(s));
}

const CALENDAR_SYNC_URL = process.env.N8N_CALENDAR_SYNC_URL;
const CALENDAR_SYNC_SECRET = process.env.N8N_CALENDAR_SYNC_SECRET;

function spanishDateTimeToISO(dateStr: string, timeStr: string): string {
  const d = parseSpanishDate(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

async function syncCalendar(payload: Record<string, unknown>): Promise<{ success: boolean; eventId?: string }> {
  if (!CALENDAR_SYNC_URL || !CALENDAR_SYNC_SECRET) return { success: false };
  try {
    const res = await fetch(CALENDAR_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-panel-secret": CALENDAR_SYNC_SECRET },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("syncCalendar failed", err);
    return { success: false };
  }
}

export async function fetchAllDataAction() {
  const [clients, quotes, invoices, appointments, pipelineCards, activityLog] = await Promise.all([
    getClients(),
    getQuotes(),
    getInvoices(),
    getAllAppointments(),
    getPipelineCards(),
    getHistoryActivities(),
  ]);
  return { clients, quotes, invoices, appointments, pipelineCards, activityLog };
}

function patientToRow(c: Client) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    birth_date: c.birthDate,
    notes: c.notes,
    last_visit: c.lastVisit,
    next_appointment: c.nextAppointment,
    status: c.status,
    channel: c.channel,
    appointments: c.appointments,
    treatments: c.treatments,
    cancellations: c.cancellations,
    reviews: c.reviews,
    timeline: c.timeline,
    medical_info: c.medicalInfo,
    clinical_notes: c.clinicalNotes,
    documents: c.documents,
  };
}

const PATIENT_PATCH_KEYS: Record<keyof Client, string> = {
  id: "id",
  name: "name",
  phone: "phone",
  email: "email",
  birthDate: "birth_date",
  notes: "notes",
  lastVisit: "last_visit",
  nextAppointment: "next_appointment",
  status: "status",
  channel: "channel",
  appointments: "appointments",
  treatments: "treatments",
  cancellations: "cancellations",
  reviews: "reviews",
  timeline: "timeline",
  medicalInfo: "medical_info",
  clinicalNotes: "clinical_notes",
  documents: "documents",
};

export async function createClientAction(c: Client) {
  const { error } = await supabaseAdmin.from("patients").insert(patientToRow(c));
  if (error) throw error;
}

export async function updateClientAction(id: string, patch: Partial<Client>) {
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof Client)[]) {
    row[PATIENT_PATCH_KEYS[key]] = patch[key];
  }
  const { error } = await supabaseAdmin.from("patients").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteClientAction(id: string) {
  const { error } = await supabaseAdmin.from("patients").delete().eq("id", id);
  if (error) throw error;
}

export async function createQuoteAction(q: Quote) {
  const { error } = await supabaseAdmin.from("quotes").insert({
    id: q.id,
    date: q.date,
    client_id: q.clientId,
    client_name: q.clientName,
    concept: q.concept,
    amount: q.amount,
    status: q.status,
    valid_until: q.validUntil,
  });
  if (error) throw error;
}

export async function updateQuoteStatusAction(id: string, status: Quote["status"]) {
  const { error } = await supabaseAdmin.from("quotes").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateQuoteAction(id: string, patch: { concept?: string; amount?: number; date?: string; validUntil?: string }) {
  const row: Record<string, unknown> = {};
  if (patch.concept !== undefined) row.concept = patch.concept;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.validUntil !== undefined) row.valid_until = patch.validUntil;
  const { error } = await supabaseAdmin.from("quotes").update(row).eq("id", id);
  if (error) throw error;
}

export async function setTreatmentStatusAction(id: string, treatmentStatus: Quote["treatmentStatus"]) {
  const { error } = await supabaseAdmin.from("quotes").update({ treatment_status: treatmentStatus }).eq("id", id);
  if (error) throw error;
}

export async function createInvoiceAction(i: Invoice) {
  const { error } = await supabaseAdmin.from("invoices").insert({
    id: i.id,
    date: i.date,
    client_id: i.clientId,
    client_name: i.clientName,
    concept: i.concept,
    amount: i.amount,
    method: i.method,
    insurer: i.insurer ?? null,
    status: i.status,
  });
  if (error) throw error;
}

export async function markInvoicePaidAction(id: string) {
  const { error } = await supabaseAdmin.from("invoices").update({ status: "Pagada" }).eq("id", id);
  if (error) throw error;
}

export async function createAppointmentAction(a: Appointment) {
  const { error } = await supabaseAdmin.from("appointments").insert({
    id: a.id,
    time: a.time,
    date: a.date,
    client_id: a.clientId,
    client_name: a.clientName,
    service: a.service,
    status: a.status,
    professional_name: a.professionalName,
    professional_role: a.professionalRole,
  });
  if (error) throw error;

  const sync = await syncCalendar({
    action: "create",
    service: a.service,
    client_name: a.clientName,
    starts_at: spanishDateTimeToISO(a.date, a.time),
  });
  if (sync.success && sync.eventId) {
    await supabaseAdmin.from("appointments").update({ event_id_google: sync.eventId }).eq("id", a.id);
  }
}

export async function setAppointmentStatusAction(id: string, status: Appointment["status"]) {
  const { error } = await supabaseAdmin.from("appointments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateAppointmentDetailsAction(
  id: string,
  patch: { service: string; professionalName: string; professionalRole: string }
) {
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ service: patch.service, professional_name: patch.professionalName, professional_role: patch.professionalRole })
    .eq("id", id);
  if (error) throw error;
}

export async function cancelAppointmentAction(id: string) {
  const { data: existing } = await supabaseAdmin.from("appointments").select("event_id_google").eq("id", id).maybeSingle();
  const { error } = await supabaseAdmin.from("appointments").update({ status: "Cancelada" }).eq("id", id);
  if (error) throw error;

  if (existing?.event_id_google) {
    await syncCalendar({ action: "cancel", event_id_google: existing.event_id_google });
  }
}

export async function rescheduleAppointmentAction(id: string, date: string, time: string) {
  const { data: existing } = await supabaseAdmin
    .from("appointments")
    .select("event_id_google, service")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("appointments").update({ date, time }).eq("id", id);
  if (error) throw error;

  if (existing?.event_id_google) {
    await syncCalendar({
      action: "reschedule",
      event_id_google: existing.event_id_google,
      service: existing.service,
      starts_at: spanishDateTimeToISO(date, time),
    });
  }
}

export async function movePipelineCardsByClientAction(clientId: string, stageId: string) {
  const { error } = await supabaseAdmin
    .from("pipeline_cards")
    .update({ stage_id: stageId, updated: "Ahora" })
    .eq("client_id", clientId);
  if (error) throw error;
}

export async function deletePipelineCardByClientAction(clientId: string) {
  const { error } = await supabaseAdmin.from("pipeline_cards").delete().eq("client_id", clientId);
  if (error) throw error;
}

export async function moveOrCreatePipelineCardAction(params: {
  clientId: string;
  clientName: string;
  stageId: string;
  detail: string;
}) {
  const { data: existing } = await supabaseAdmin
    .from("pipeline_cards")
    .select("id")
    .eq("client_id", params.clientId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("pipeline_cards")
      .update({ stage_id: params.stageId, detail: params.detail, updated: "Ahora" })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("pipeline_cards").insert({
      client_id: params.clientId,
      client_name: params.clientName,
      stage_id: params.stageId,
      detail: params.detail,
      updated: "Ahora",
    });
    if (error) throw error;
  }
}
