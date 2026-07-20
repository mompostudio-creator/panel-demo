"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Check,
  X as XIcon,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Pencil,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, StatusBadge, Modal, FieldLabel, inputClass } from "@/components/ui";
import { useAppData } from "@/lib/store";
import { parseSpanishDate, formatRelativeTime } from "@/lib/dates";
import type { Quote, Client } from "@/lib/types";

const PAGE_SIZE = 8;
const TABS = ["Todos", "Borradores", "Enviados", "Aceptados", "Rechazados", "Caducados"] as const;
type Tab = (typeof TABS)[number];
type ComputedStatus = "Enviado" | "Aceptado" | "Rechazado" | "Caducado";

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

function computeStatus(q: Quote): ComputedStatus {
  if (q.status === "Aprobado") return "Aceptado";
  if (q.status === "Rechazado") return "Rechazado";
  const until = tryParseSpanishDate(q.validUntil);
  if (until && until.getTime() < Date.now()) return "Caducado";
  return "Enviado";
}

const EVENT_ICON: Record<string, typeof FileText> = {
  presupuesto_creado: FileText,
  presupuesto_aprobado: CheckCircle2,
  presupuesto_rechazado: XCircle,
};

export function QuotesTable() {
  const { quotes, clients, activityLog, addQuote, updateQuote, setQuoteStatus } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [tab, setTab] = useState<Tab>("Todos");
  const [search, setSearch] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState<"Todos" | Quote["treatmentStatus"]>("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const numberById = new Map(
    quotes
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((q, idx, arr) => [q.id, `PRE-${String(arr.length - idx).padStart(5, "0")}`])
  );

  const counts: Record<Tab, number> = {
    Todos: quotes.length,
    Borradores: 0,
    Enviados: quotes.filter((q) => computeStatus(q) === "Enviado").length,
    Aceptados: quotes.filter((q) => computeStatus(q) === "Aceptado").length,
    Rechazados: quotes.filter((q) => computeStatus(q) === "Rechazado").length,
    Caducados: quotes.filter((q) => computeStatus(q) === "Caducado").length,
  };

  const query = search.trim().toLowerCase();
  const filtered = quotes.filter((q) => {
    if (tab === "Borradores") return false;
    const status = computeStatus(q);
    if (tab === "Enviados" && status !== "Enviado") return false;
    if (tab === "Aceptados" && status !== "Aceptado") return false;
    if (tab === "Rechazados" && status !== "Rechazado") return false;
    if (tab === "Caducados" && status !== "Caducado") return false;
    if (treatmentFilter !== "Todos" && q.treatmentStatus !== treatmentFilter) return false;
    if (query) {
      const number = (numberById.get(q.id) ?? "").toLowerCase();
      const matches = q.clientName.toLowerCase().includes(query) || number.includes(query) || q.concept.toLowerCase().includes(query);
      if (!matches) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((q) => selected.has(q.id));

  const selectedQuote = quotes.find((q) => q.id === selectedId) ?? filtered[0] ?? null;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((q) => next.delete(q.id));
      else pageItems.forEach((q) => next.add(q.id));
      return next;
    });
  }

  function handleBulkAccept() {
    for (const id of selected) {
      const q = quotes.find((qq) => qq.id === id);
      if (q && q.status === "Pendiente") setQuoteStatus(id, "Aprobado");
    }
    setSelected(new Set());
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-ink-secondary mt-1.5">Crea, envía y gestiona todos los presupuestos de tratamiento.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150 sm:shrink-0"
        >
          <Plus size={15} />
          Nuevo presupuesto
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 bg-plane rounded-lg p-1 max-w-full overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
                setSelectedId(null);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                tab === t ? "bg-accent text-white shadow-sm" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {t}
              {counts[t] > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    tab === t ? "bg-white/25 text-white" : "bg-surface text-ink-muted"
                  }`}
                >
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setSelectedId(null);
            }}
            placeholder="Buscar presupuesto, paciente o tratamiento…"
            className="pl-8 pr-3 py-2 w-full rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              treatmentFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {treatmentFilter === "Todos" ? "Filtros" : `Tratamiento ${treatmentFilter.toLowerCase()}`}
          </button>
          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 mt-1 w-56 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <p className="px-3.5 py-1.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wide">Estado del tratamiento</p>
                {(["Todos", "Pendiente", "Realizado"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTreatmentFilter(t);
                      setPage(1);
                      setSelectedId(null);
                      setFiltersOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    {t}
                    {treatmentFilter === t && <Check size={13} className="text-accent" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-accent-light border border-accent/20 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm text-accent font-medium">
            {selected.size} {selected.size === 1 ? "presupuesto seleccionado" : "presupuestos seleccionados"}
          </span>
          <div className="flex items-center gap-4">
            <button onClick={handleBulkAccept} className="text-xs font-medium text-accent hover:underline">
              Marcar como aceptados
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-ink-secondary hover:underline">
              Cancelar selección
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <Card className="overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm table-fixed">
              <thead>
                <tr className="text-left text-xs font-medium text-ink-muted border-b border-border">
                  <th className="py-2.5 pl-5 pr-2 w-9">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      style={{ accentColor: "#2a78d6" }}
                      className="w-3.5 h-3.5 rounded border-border"
                    />
                  </th>
                  <th className="py-2.5 px-3 min-w-[160px]">Presupuesto</th>
                  <th className="py-2.5 px-3 w-[130px]">Paciente</th>
                  <th className="py-2.5 px-3 w-[85px]">Fecha</th>
                  <th className="py-2.5 px-3 w-[95px]">Caducidad</th>
                  <th className="py-2.5 px-3 w-[90px]">Estado</th>
                  <th className="py-2.5 px-3 w-[85px] text-right">Importe</th>
                  <th className="py-2.5 px-3 w-[56px]"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((q) => {
                  const status = computeStatus(q);
                  const isSelected = selectedQuote?.id === q.id;
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedId(q.id)}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                        isSelected ? "bg-accent-light/60" : "hover:bg-plane"
                      }`}
                    >
                      <td className="py-3 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggleSelected(q.id)}
                          style={{ accentColor: "#2a78d6" }}
                          className="w-3.5 h-3.5 rounded border-border"
                        />
                      </td>
                      <td className="py-3 px-3 min-w-0">
                        <p className="text-sm font-semibold truncate">{numberById.get(q.id)}</p>
                        <p className="text-xs text-ink-muted truncate">{q.concept || "—"}</p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent shrink-0">
                            {initials(q.clientName)}
                          </span>
                          <p className="text-xs font-medium truncate">{q.clientName}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-ink-secondary">{q.date}</td>
                      <td className={`py-3 px-3 text-xs ${status === "Caducado" ? "text-critical font-medium" : "text-ink-secondary"}`}>
                        {q.validUntil}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3 px-3 text-right font-medium tabular text-sm">{q.amount}€</td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setMenuFor(menuFor === q.id ? null : q.id)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white transition-colors"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {menuFor === q.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                              <div className="absolute right-0 top-8 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedId(q.id);
                                    setMenuFor(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                >
                                  Ver detalle
                                </button>
                                {q.status === "Pendiente" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setQuoteStatus(q.id, "Aprobado");
                                        setMenuFor(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                    >
                                      Marcar como aceptado
                                    </button>
                                    <button
                                      onClick={() => {
                                        setQuoteStatus(q.id, "Rechazado");
                                        setMenuFor(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-sm text-critical hover:bg-critical-bg"
                                    >
                                      Marcar como rechazado
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-ink-muted">
                      No hay presupuestos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-ink-muted">
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}{" "}
                presupuestos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-ink-muted tabular">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-border text-ink-secondary hover:bg-plane transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>

        <QuoteDetailPanel
          quote={selectedQuote}
          number={selectedQuote ? numberById.get(selectedQuote.id) : undefined}
          status={selectedQuote ? computeStatus(selectedQuote) : undefined}
          history={selectedQuote ? activityLog.filter((h) => h.entityType === "quote" && h.entityId === selectedQuote.id) : []}
          onAccept={() => selectedQuote && setQuoteStatus(selectedQuote.id, "Aprobado")}
          onReject={() => selectedQuote && setQuoteStatus(selectedQuote.id, "Rechazado")}
          onEdit={() => selectedQuote && setEditingQuote(selectedQuote)}
        />
      </div>

      <QuoteFormModal open={addOpen} onClose={() => setAddOpen(false)} clients={clients} onCreate={addQuote} />
      <QuoteFormModal
        key={editingQuote?.id ?? "no-quote-editing"}
        open={editingQuote !== null}
        onClose={() => setEditingQuote(null)}
        clients={clients}
        editing={editingQuote}
        onUpdate={(patch) => {
          if (editingQuote) updateQuote(editingQuote.id, patch);
        }}
      />
    </div>
  );
}

function QuoteDetailPanel({
  quote,
  number,
  status,
  history,
  onAccept,
  onReject,
  onEdit,
}: {
  quote: Quote | null;
  number?: string;
  status?: ComputedStatus;
  history: ReturnType<typeof useAppData>["activityLog"];
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  if (!quote) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <p className="text-sm text-ink-muted">No hay ningún presupuesto que coincida con los filtros.</p>
      </div>
    );
  }

  const sortedHistory = history
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-lg font-bold tracking-tight">{number}</h2>
          {status && <StatusBadge status={status} />}
        </div>
        <p className="text-xs text-ink-muted mb-4">
          Creado el {quote.date} · Vence {quote.validUntil}
        </p>

        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-xs font-semibold text-accent shrink-0">
              {initials(quote.clientName)}
            </span>
            <p className="text-sm font-semibold truncate">{quote.clientName}</p>
          </div>
          {quote.clientId && (
            <Link
              href={`/pacientes/${quote.clientId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-plane transition-colors shrink-0"
            >
              <User size={12} />
              Ver paciente
            </Link>
          )}
        </div>

        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Tratamiento incluido</p>
        <div className="rounded-xl border border-border overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-ink-muted border-b border-border">
                <th className="py-2 px-3 font-medium">Tratamiento</th>
                <th className="py-2 px-3 font-medium text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2.5 px-3">{quote.concept || "—"}</td>
                <td className="py-2.5 px-3 text-right tabular font-medium">{quote.amount}€</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold pt-1">
          <span>Total</span>
          <span className="text-accent tabular">{quote.amount}€</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3">Historial de actividad</p>
        {sortedHistory.length === 0 ? (
          <p className="text-xs text-ink-muted">Sin actividad registrada todavía.</p>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map((h, i) => {
              const Icon = (h.eventType && EVENT_ICON[h.eventType]) || FileText;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-accent" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{h.label}</p>
                  </div>
                  <span className="text-[11px] text-ink-muted shrink-0">{formatRelativeTime(h.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {quote.status === "Pendiente" && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onAccept}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-good text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150"
          >
            <Check size={15} />
            Marcar como aceptado
          </button>
          <button
            onClick={onReject}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-critical-bg text-critical text-sm font-medium rounded-xl hover:opacity-80 transition-all duration-150"
          >
            <XIcon size={15} />
            Marcar como rechazado
          </button>
        </div>
      )}
      <button
        onClick={onEdit}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-plane transition-all duration-150"
      >
        <Pencil size={14} />
        Editar presupuesto
      </button>
    </div>
  );
}

function QuoteFormModal({
  open,
  onClose,
  clients,
  editing,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  editing?: Quote | null;
  onCreate?: ReturnType<typeof useAppData>["addQuote"];
  onUpdate?: (patch: { concept: string; amount: number; date: string; validUntil: string }) => void;
}) {
  const isEdit = !!editing;
  const OTHER_OPTION = "__other__";
  const [clientChoice, setClientChoice] = useState(editing?.clientId ?? clients[0]?.id ?? OTHER_OPTION);
  const [otherName, setOtherName] = useState(editing && !editing.clientId ? editing.clientName : "");
  const [concept, setConcept] = useState(editing?.concept ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [date, setDate] = useState(editing?.date ?? "");
  const [validUntil, setValidUntil] = useState(editing?.validUntil ?? "");

  function reset() {
    setOtherName("");
    setConcept("");
    setAmount("");
    setDate("");
    setValidUntil("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concept.trim() || !date.trim() || !validUntil.trim()) return;

    if (isEdit && onUpdate) {
      onUpdate({ concept: concept.trim(), amount: Number(amount) || 0, date: date.trim(), validUntil: validUntil.trim() });
      onClose();
      return;
    }

    const isOther = clientChoice === OTHER_OPTION;
    const client = isOther ? null : clients.find((c) => c.id === clientChoice) ?? null;
    const clientName = isOther ? otherName.trim() : client?.name ?? "";
    if (!clientName || !onCreate) return;

    onCreate({
      date: date.trim(),
      clientId: client?.id ?? null,
      clientName,
      concept: concept.trim(),
      amount: Number(amount) || 0,
      validUntil: validUntil.trim(),
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {!isEdit && (
          <div>
            <FieldLabel>Paciente</FieldLabel>
            <select value={clientChoice} onChange={(e) => setClientChoice(e.target.value)} className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={OTHER_OPTION}>Otro paciente…</option>
            </select>
          </div>
        )}
        {!isEdit && clientChoice === OTHER_OPTION && (
          <div>
            <FieldLabel>Nombre del paciente</FieldLabel>
            <input required value={otherName} onChange={(e) => setOtherName(e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <FieldLabel>Concepto</FieldLabel>
          <input required value={concept} onChange={(e) => setConcept(e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Importe (€)</FieldLabel>
          <input required type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <input required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} placeholder="13 jul 2026" />
          </div>
          <div>
            <FieldLabel>Válido hasta</FieldLabel>
            <input
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
              placeholder="25 jul 2026"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          {isEdit ? "Guardar cambios" : "Crear presupuesto"}
        </button>
      </form>
    </Modal>
  );
}
