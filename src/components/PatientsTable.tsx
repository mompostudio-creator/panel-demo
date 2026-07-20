"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  CalendarPlus,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Card, StatTile, StatusBadge, Modal, FieldLabel, inputClass } from "@/components/ui";
import { NewPatientModal } from "@/components/NewPatientModal";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { useAppData } from "@/lib/store";
import { parseSpanishDate } from "@/lib/dates";
import { CLIENT_STATUSES, type Client } from "@/lib/types";

const CHANNELS = ["Instagram", "WhatsApp", "Formulario web", "Recomendación", "Otro"];
const PAGE_SIZE = 10;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function tryParseSpanishDate(str: string): Date | null {
  try {
    return parseSpanishDate(str);
  } catch {
    return null;
  }
}

function computeAge(birthDate: string): number | null {
  const d = tryParseSpanishDate(birthDate);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const hadBirthdayThisYear = now.getMonth() > d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
}

function daysAgoLabel(dateStr: string): string | null {
  const d = tryParseSpanishDate(dateStr);
  if (!d) return null;
  const diffDays = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diffDays < 0) return null;
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
}

export function PatientsTable() {
  const { clients, appointments, invoices, quotes, pipelineCards, addClient, updateClient, deleteClient, addAppointment } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [appointmentFor, setAppointmentFor] = useState<Client | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Client["status"] | "Todos">("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", channel: CHANNELS[0], notes: "", status: "Activo" as Client["status"] });

  function openEdit(patient: Client) {
    setForm({
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      channel: patient.channel,
      notes: patient.notes,
      status: patient.status,
    });
    setEditingId(patient.id);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este paciente?")) return;
    deleteClient(id);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !editingId) return;

    updateClient(editingId, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      channel: form.channel,
      notes: form.notes.trim(),
      status: form.status,
    });

    setEditingId(null);
  }

  const activeCount = clients.filter((c) => c.status === "Activo").length;
  const followUpCount = pipelineCards.filter((c) => c.stageId === "en-seguimiento").length;
  const pendingQuoteCount = quotes.filter((q) => q.status === "Pendiente").length;
  const reactivateCount = pipelineCards.filter((c) => c.stageId === "perdido").length;

  const now = new Date();
  const newClientsThisMonth = appointments.filter((a) => {
    if (a.service !== "Primera visita") return false;
    const d = tryParseSpanishDate(a.date);
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const query = search.trim().toLowerCase();
  const filteredClients = clients.filter((c) => {
    const matchesQuery =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "Todos" || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageClients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-ink-secondary mt-1.5">Gestiona todos los pacientes de tu clínica.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar paciente, teléfono, email…"
              className="pl-9 pr-3 py-2.5 w-full sm:w-64 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors ${
                  statusFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
                }`}
              >
                <SlidersHorizontal size={14} />
                Filtros
              </button>
              {filtersOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                    <button
                      onClick={() => {
                        setStatusFilter("Todos");
                        setPage(1);
                        setFiltersOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                    >
                      Todos los estados
                      {statusFilter === "Todos" && <Check size={13} className="text-accent" />}
                    </button>
                    {CLIENT_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStatusFilter(s);
                          setPage(1);
                          setFiltersOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                      >
                        {s}
                        {statusFilter === s && <Check size={13} className="text-accent" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150"
            >
              <Plus size={15} />
              Nuevo paciente
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Pacientes activos"
          value={String(activeCount)}
          icon={Users}
          tone="accent"
          delta={newClientsThisMonth > 0 ? `+${newClientsThisMonth} este mes` : undefined}
          deltaGood
        />
        <StatTile label="Presupuesto pendiente" value={String(pendingQuoteCount)} icon={FileText} tone="warning" />
        <StatTile label="En seguimiento" value={String(followUpCount)} icon={Clock} tone="violet" />
        <StatTile
          label="Para reactivar"
          value={String(reactivateCount)}
          icon={RefreshCw}
          tone="critical"
          delta={reactivateCount > 0 ? "Ver candidatos" : undefined}
          deltaHref="/pipeline"
          deltaGood={false}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs font-medium text-ink-muted border-b border-border">
              <th className="py-3 px-6">Paciente</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Última visita</th>
              <th className="py-3 px-4">Tratamiento</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Valor total</th>
              <th className="py-3 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageClients.map((c) => {
              const age = computeAge(c.birthDate);
              const lastVisitRelative = c.lastVisit !== "—" ? daysAgoLabel(c.lastVisit) : null;
              const latestTreatment = c.treatments.length > 0 ? c.treatments[c.treatments.length - 1].label : null;
              const totalValue = invoices
                .filter((i) => i.clientId === c.id && i.status === "Pagada")
                .reduce((sum, i) => sum + i.amount, 0);
              const hasPhone = c.phone && c.phone !== "—";

              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-plane transition-colors">
                  <td className="py-3.5 px-6">
                    <Link href={`/pacientes/${c.id}`} className="flex items-center gap-3 group">
                      <span className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                        {initials(c.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">{c.name}</p>
                        <p className="text-xs text-ink-muted truncate">{age !== null ? `${age} años` : c.channel}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary">
                    <p className="text-sm">{c.phone}</p>
                    <p className="text-xs text-ink-muted truncate">{c.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary">
                    <p className="text-sm">{c.lastVisit}</p>
                    {lastVisitRelative && <p className="text-xs text-ink-muted">{lastVisitRelative}</p>}
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-sm">{latestTreatment ?? "—"}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium tabular">{totalValue > 0 ? `${totalValue}€` : "—"}</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/pacientes/${c.id}`}
                        title="Ver ficha"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent-light transition-colors"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => setAppointmentFor(c)}
                        title="Nueva cita"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent-light transition-colors"
                      >
                        <CalendarPlus size={15} />
                      </button>
                      {hasPhone && (
                        <a
                          href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="p-1.5 rounded-lg text-ink-muted hover:text-good hover:bg-good-bg transition-colors"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-plane transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {menuFor === c.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 mt-1 w-36 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                              <button
                                onClick={() => {
                                  openEdit(c);
                                  setMenuFor(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center gap-2"
                              >
                                <Pencil size={13} />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(c.id);
                                  setMenuFor(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-sm text-critical hover:bg-critical-bg flex items-center gap-2"
                              >
                                <Trash2 size={13} />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageClients.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-ink-muted">
                  No se encontraron pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {filteredClients.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
            <p className="text-xs text-ink-muted">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filteredClients.length)} de{" "}
              {filteredClients.length} pacientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-ink-muted tabular">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <NewPatientModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={addClient} />
      <NewAppointmentModal
        open={appointmentFor !== null}
        onClose={() => setAppointmentFor(null)}
        clients={clients}
        lockedClient={appointmentFor ?? undefined}
        onCreate={addAppointment}
      />

      <Modal open={editingId !== null} onClose={() => setEditingId(null)} title="Editar paciente">
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
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
          <div className="grid grid-cols-2 gap-3">
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
              <FieldLabel>Estado</FieldLabel>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Client["status"] })}
                className={inputClass}
              >
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
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
            Guardar cambios
          </button>
        </form>
      </Modal>
    </>
  );
}
