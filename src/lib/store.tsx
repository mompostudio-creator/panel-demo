"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Client, Invoice, Quote, Appointment, PipelineCard, HistoryActivity } from "@/lib/types";
import type { AutomationView } from "@/lib/data";
import { parseSpanishDate } from "@/lib/dates";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
  createQuoteAction,
  updateQuoteAction,
  updateQuoteStatusAction,
  setTreatmentStatusAction,
  createInvoiceAction,
  markInvoicePaidAction,
  createAppointmentAction,
  cancelAppointmentAction,
  rescheduleAppointmentAction,
  setAppointmentStatusAction,
  updateAppointmentDetailsAction,
  movePipelineCardsByClientAction,
  moveOrCreatePipelineCardAction,
  deletePipelineCardByClientAction,
  fetchAllDataAction,
} from "@/lib/actions";

const REFRESH_INTERVAL_MS = 5000;
const FOLLOW_UP_THRESHOLD_MS = 48 * 60 * 60 * 1000;

interface AppDataContextValue {
  clients: Client[];
  quotes: Quote[];
  invoices: Invoice[];
  appointments: Appointment[];
  pipelineCards: PipelineCard[];
  activityLog: HistoryActivity[];
  automations: AutomationView[];
  lastSyncedAt: string;
  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addQuote: (q: Omit<Quote, "id" | "status" | "treatmentStatus"> & { id?: string; status?: Quote["status"] }) => void;
  updateQuote: (id: string, patch: { concept?: string; amount?: number; date?: string; validUntil?: string }) => void;
  setQuoteStatus: (id: string, status: Quote["status"]) => void;
  setTreatmentStatus: (id: string, treatmentStatus: Quote["treatmentStatus"]) => void;
  addInvoice: (i: Invoice) => void;
  markInvoicePaid: (id: string) => void;
  addAppointment: (a: Appointment) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  updateAppointmentDetails: (id: string, patch: { service: string; professionalName: string; professionalRole: string }) => void;
  setAppointmentStatus: (id: string, status: Appointment["status"]) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  initialClients,
  initialQuotes,
  initialInvoices,
  initialAppointments,
  initialPipelineCards,
  initialActivityLog,
  initialAutomations,
  children,
}: {
  initialClients: Client[];
  initialQuotes: Quote[];
  initialInvoices: Invoice[];
  initialAppointments: Appointment[];
  initialPipelineCards: PipelineCard[];
  initialActivityLog: HistoryActivity[];
  initialAutomations: AutomationView[];
  children: ReactNode;
}) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [pipelineCards, setPipelineCards] = useState<PipelineCard[]>(initialPipelineCards);
  const [activityLog, setActivityLog] = useState<HistoryActivity[]>(initialActivityLog);
  const [automations] = useState<AutomationView[]>(initialAutomations);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toISOString());

  // Un presupuesto que lleva 48h+ como Pendiente, sin aprobar ni rechazar,
  // pasa solo de "Presupuesto enviado" a "En seguimiento".
  function checkFollowUps(freshQuotes: Quote[], freshCards: PipelineCard[]) {
    const now = Date.now();
    for (const quote of freshQuotes) {
      if (quote.status !== "Pendiente" || !quote.clientId) continue;
      let sentAt: number;
      try {
        sentAt = parseSpanishDate(quote.date).getTime();
      } catch {
        continue;
      }
      if (now - sentAt < FOLLOW_UP_THRESHOLD_MS) continue;

      const card = freshCards.find((c) => c.clientId === quote.clientId);
      if (card?.stageId === "presupuesto-enviado") {
        const enSeguimientoId = "en-seguimiento";
        setPipelineCards((prev) =>
          prev.map((c) => (c.clientId === quote.clientId ? { ...c, stageId: enSeguimientoId, updated: "Ahora" } : c))
        );
        movePipelineCardsByClientAction(quote.clientId, enSeguimientoId).catch((err) =>
          console.error("movePipelineCardsByClientAction failed", err)
        );
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const fresh = await fetchAllDataAction();
        if (cancelled) return;
        setClients(fresh.clients);
        setQuotes(fresh.quotes);
        setInvoices(fresh.invoices);
        setAppointments(fresh.appointments);
        setPipelineCards(fresh.pipelineCards);
        setActivityLog(fresh.activityLog);
        setLastSyncedAt(new Date().toISOString());
        checkFollowUps(fresh.quotes, fresh.pipelineCards);
      } catch (err) {
        console.error("fetchAllDataAction failed", err);
      }
    }

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // El registro real en Actividades lo generan triggers en la base de datos
  // (funciona igual venga el cambio del panel o de WhatsApp). Esto solo
  // adelanta la vista mientras llega esa fila real en el siguiente refresco.
  function logActivity(label: string) {
    setActivityLog((prev) => [{ time: "Ahora", label, createdAt: new Date().toISOString() }, ...prev]);
  }

  function addClient(c: Client) {
    setClients((prev) => [c, ...prev]);
    createClientAction(c).catch((err) => console.error("createClientAction failed", err));
    const nuevoContactoId = "nuevo-lead";
    setPipelineCards((prev) => [
      {
        id: `pc-${Date.now()}`,
        stageId: nuevoContactoId,
        clientId: c.id,
        clientName: c.name,
        detail: "Nuevo paciente registrado",
        updated: "Ahora",
      },
      ...prev,
    ]);
    moveOrCreatePipelineCardAction({
      clientId: c.id,
      clientName: c.name,
      stageId: nuevoContactoId,
      detail: "Nuevo paciente registrado",
    }).catch((err) => console.error("moveOrCreatePipelineCardAction failed", err));
    logActivity(`Nuevo paciente registrado: ${c.name}`);
  }
  function updateClient(id: string, patch: Partial<Client>) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    updateClientAction(id, patch).catch((err) => console.error("updateClientAction failed", err));
    if (patch.status === "Inactivo") {
      const perdidoId = "perdido";
      setPipelineCards((prev) => prev.map((c) => (c.clientId === id ? { ...c, stageId: perdidoId, updated: "Ahora" } : c)));
      movePipelineCardsByClientAction(id, perdidoId).catch((err) =>
        console.error("movePipelineCardsByClientAction failed", err)
      );
    }
  }
  function deleteClient(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteClientAction(id).catch((err) => console.error("deleteClientAction failed", err));
  }

  function addInvoice(i: Invoice) {
    setInvoices((prev) => [i, ...prev]);
    createInvoiceAction(i).catch((err) => console.error("createInvoiceAction failed", err));
    logActivity(`Factura registrada: ${i.clientName} · ${i.amount}€`);
  }
  function markInvoicePaid(id: string) {
    const invoice = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: "Pagada" } : i)));
    markInvoicePaidAction(id).catch((err) => console.error("markInvoicePaidAction failed", err));
    if (invoice) logActivity(`Factura cobrada: ${invoice.clientName} · ${invoice.amount}€`);
  }

  function addQuote(
    q: Omit<Quote, "id" | "status" | "treatmentStatus"> & { id?: string; status?: Quote["status"] }
  ) {
    const quote: Quote = {
      id: q.id ?? `q-${Date.now()}`,
      status: q.status ?? "Pendiente",
      date: q.date,
      clientId: q.clientId,
      clientName: q.clientName,
      concept: q.concept,
      amount: q.amount,
      validUntil: q.validUntil,
      treatmentStatus: "Pendiente",
    };
    setQuotes((prev) => [quote, ...prev]);
    createQuoteAction(quote).catch((err) => console.error("createQuoteAction failed", err));
    if (quote.clientId) {
      const presupuestoEnviadoId = "presupuesto-enviado";
      setPipelineCards((prev) =>
        prev.map((c) =>
          c.clientId === quote.clientId
            ? { ...c, stageId: presupuestoEnviadoId, detail: `${quote.concept} · ${quote.amount}€`, updated: "Ahora" }
            : c
        )
      );
      moveOrCreatePipelineCardAction({
        clientId: quote.clientId,
        clientName: quote.clientName,
        stageId: presupuestoEnviadoId,
        detail: `${quote.concept} · ${quote.amount}€`,
      }).catch((err) => console.error("moveOrCreatePipelineCardAction failed", err));
    }
    logActivity(`Presupuesto propuesto a ${quote.clientName}: ${quote.concept} (${quote.amount}€)`);
  }

  function updateQuote(id: string, patch: { concept?: string; amount?: number; date?: string; validUntil?: string }) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    updateQuoteAction(id, patch).catch((err) => console.error("updateQuoteAction failed", err));
  }

  function setQuoteStatus(id: string, status: Quote["status"]) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    updateQuoteStatusAction(id, status).catch((err) => console.error("updateQuoteStatusAction failed", err));
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;

    if (status === "Aprobado") {
      logActivity(`Presupuesto aprobado: ${quote.concept} (${quote.clientName})`);
      addInvoice({
        id: `inv-${Date.now()}`,
        date: "Ahora",
        clientId: quote.clientId,
        clientName: quote.clientName,
        concept: quote.concept,
        amount: quote.amount,
        method: "Financiado",
        status: "Pendiente",
      });
      if (quote.clientId) {
        const aceptadoId = "aceptado";
        setPipelineCards((prev) =>
          prev.map((c) => (c.clientId === quote.clientId ? { ...c, stageId: aceptadoId, updated: "Ahora" } : c))
        );
        movePipelineCardsByClientAction(quote.clientId, aceptadoId).catch((err) =>
          console.error("movePipelineCardsByClientAction failed", err)
        );
      }
    } else if (status === "Rechazado") {
      logActivity(`Presupuesto rechazado: ${quote.concept} (${quote.clientName})`);
      if (quote.clientId) {
        const perdidoId = "perdido";
        setPipelineCards((prev) =>
          prev.map((c) => (c.clientId === quote.clientId ? { ...c, stageId: perdidoId, updated: "Ahora" } : c))
        );
        movePipelineCardsByClientAction(quote.clientId, perdidoId).catch((err) =>
          console.error("movePipelineCardsByClientAction failed", err)
        );
      }
    }
  }

  // Lo marca la clínica a mano en la ficha del paciente: solo ella sabe si el
  // tratamiento ya se ha llevado a cabo, no hay forma fiable de deducirlo.
  function setTreatmentStatus(id: string, treatmentStatus: Quote["treatmentStatus"]) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, treatmentStatus } : q)));
    setTreatmentStatusAction(id, treatmentStatus).catch((err) => console.error("setTreatmentStatusAction failed", err));
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;

    if (treatmentStatus === "Realizado") {
      logActivity(`Tratamiento finalizado: ${quote.concept} (${quote.clientName})`);
      if (quote.clientId) {
        const card = pipelineCards.find((c) => c.clientId === quote.clientId);
        if (card?.stageId === "tratamiento-en-curso") {
          const finalizadoId = "finalizado";
          setPipelineCards((prev) =>
            prev.map((c) => (c.clientId === quote.clientId ? { ...c, stageId: finalizadoId, updated: "Ahora" } : c))
          );
          movePipelineCardsByClientAction(quote.clientId, finalizadoId).catch((err) =>
            console.error("movePipelineCardsByClientAction failed", err)
          );
        }
      }
    }
  }

  function addAppointment(a: Appointment) {
    setAppointments((prev) => [...prev, a]);
    createAppointmentAction(a).catch((err) => console.error("createAppointmentAction failed", err));
    if (a.clientId) {
      updateClient(a.clientId, { nextAppointment: `${a.date} · ${a.time}` });

      // Agendar una cita es algo que pasa una y otra vez a lo largo de toda la
      // relación con el paciente, no solo la primera vez: cualquier cita nueva
      // reactiva la tarjeta a "Visita agendada", venga de donde venga, salvo
      // que ya esté en tratamiento (ahí una cita más es lo esperado, no una
      // señal de nada nuevo) o recién Aceptado (donde sí marca que el
      // tratamiento arranca).
      const existingCard = pipelineCards.find((c) => c.clientId === a.clientId);
      const targetStageId =
        existingCard?.stageId === "aceptado"
          ? "tratamiento-en-curso"
          : existingCard?.stageId === "tratamiento-en-curso"
            ? null
            : "visita-agendada";

      if (targetStageId) {
        setPipelineCards((prev) =>
          prev.map((c) =>
            c.clientId === a.clientId ? { ...c, stageId: targetStageId, detail: `${a.service} · ${a.date} ${a.time}`, updated: "Ahora" } : c
          )
        );
        moveOrCreatePipelineCardAction({
          clientId: a.clientId,
          clientName: a.clientName,
          stageId: targetStageId,
          detail: `${a.service} · ${a.date} ${a.time}`,
        }).catch((err) => console.error("moveOrCreatePipelineCardAction failed", err));
      }
    }
    logActivity(`Nueva cita: ${a.clientName} el ${a.date} a las ${a.time}`);
  }
  function cancelAppointment(id: string) {
    const appointment = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Cancelada" } : a)));
    cancelAppointmentAction(id).catch((err) => console.error("cancelAppointmentAction failed", err));
    if (appointment) {
      logActivity(`Cita cancelada: ${appointment.clientName}`);
      const client = appointment.clientId ? clients.find((c) => c.id === appointment.clientId) : null;
      if (client && client.nextAppointment === `${appointment.date} · ${appointment.time}`) {
        updateClient(client.id, { nextAppointment: null });
      }

      // Si ya no le queda ninguna otra cita programada y su tarjeta solo
      // estaba ahí por tener una visita agendada, no tiene sentido dejarla
      // como "Nuevo lead" (ya no es un contacto nuevo) — se quita del
      // Pipeline. Una futura cita nueva volverá a crearla desde cero.
      if (appointment.clientId) {
        const otherPending = appointments.some(
          (a) => a.id !== id && a.clientId === appointment.clientId && (a.status === "Confirmada" || a.status === "Modificada")
        );
        const card = pipelineCards.find((c) => c.clientId === appointment.clientId);
        if (!otherPending && card?.stageId === "visita-agendada") {
          setPipelineCards((prev) => prev.filter((c) => c.clientId !== appointment.clientId));
          deletePipelineCardByClientAction(appointment.clientId).catch((err) =>
            console.error("deletePipelineCardByClientAction failed", err)
          );
        }
      }
    }
  }
  function rescheduleAppointment(id: string, date: string, time: string) {
    const appointment = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, date, time } : a)));
    rescheduleAppointmentAction(id, date, time).catch((err) => console.error("rescheduleAppointmentAction failed", err));
    if (appointment) logActivity(`Cita reagendada: ${appointment.clientName} → ${date} ${time}`);
  }
  function updateAppointmentDetails(
    id: string,
    patch: { service: string; professionalName: string; professionalRole: string }
  ) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    updateAppointmentDetailsAction(id, patch).catch((err) => console.error("updateAppointmentDetailsAction failed", err));
  }
  function setAppointmentStatus(id: string, status: Appointment["status"]) {
    if (status === "Cancelada") {
      cancelAppointment(id);
      return;
    }
    const appointment = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setAppointmentStatusAction(id, status).catch((err) => console.error("setAppointmentStatusAction failed", err));
    if (appointment) logActivity(`Cita marcada como ${status}: ${appointment.clientName}`);

    // Completar la cita mientras la tarjeta está en "Visita agendada"
    // significa que el profesional ya ha valorado al paciente.
    if (status === "Completada" && appointment?.clientId) {
      const card = pipelineCards.find((c) => c.clientId === appointment.clientId);
      if (card?.stageId === "visita-agendada") {
        const diagnosticoId = "diagnostico";
        setPipelineCards((prev) =>
          prev.map((c) => (c.clientId === appointment.clientId ? { ...c, stageId: diagnosticoId, updated: "Ahora" } : c))
        );
        movePipelineCardsByClientAction(appointment.clientId, diagnosticoId).catch((err) =>
          console.error("movePipelineCardsByClientAction failed", err)
        );
      }
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        clients,
        quotes,
        invoices,
        appointments,
        pipelineCards,
        activityLog,
        automations,
        lastSyncedAt,
        addClient,
        updateClient,
        deleteClient,
        addQuote,
        updateQuote,
        setQuoteStatus,
        setTreatmentStatus,
        addInvoice,
        markInvoicePaid,
        addAppointment,
        cancelAppointment,
        rescheduleAppointment,
        updateAppointmentDetails,
        setAppointmentStatus,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
