"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Card, StatTile, StatusBadge, Modal, FieldLabel, inputClass } from "@/components/ui";
import { BarChart } from "@/components/charts/BarChart";
import { useAppData } from "@/lib/store";
import { parseSpanishDate, formatSpanishDate, addDays, MONTHS_ES } from "@/lib/dates";
import type { Invoice, Client } from "@/lib/types";

const METHOD_LABEL: Record<string, string> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Seguro: "Seguro médico",
  Financiado: "Financiado",
};

const METHODS: Invoice["method"][] = ["Efectivo", "Tarjeta", "Seguro", "Financiado"];
const OTHER_OPTION = "__other__";
const PAGE_SIZE = 8;
const DUE_DAYS = 14;
const TABS = ["Todas", "Borrador", "Pendientes", "Pagadas", "Vencidas", "Anuladas"] as const;
type Tab = (typeof TABS)[number];
type ComputedStatus = "Pendiente" | "Pagada" | "Vencida";

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

function computeStatus(inv: Invoice): ComputedStatus {
  if (inv.status === "Pagada") return "Pagada";
  const issued = tryParseSpanishDate(inv.date);
  if (issued && addDays(issued, DUE_DAYS).getTime() < Date.now()) return "Vencida";
  return "Pendiente";
}

function dueDateLabel(inv: Invoice): string {
  const issued = tryParseSpanishDate(inv.date);
  if (!issued) return "—";
  return formatSpanishDate(addDays(issued, DUE_DAYS));
}

function isInMonth(dateStr: string, ref: Date): boolean {
  const d = tryParseSpanishDate(dateStr);
  return !!d && d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function InvoicesTable() {
  const { invoices, clients, addInvoice, markInvoicePaid } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Todas");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"Todos" | Invoice["method"]>("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [period, setPeriod] = useState<"Este mes" | "Todo">("Este mes");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const numberById = new Map(
    invoices
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((inv, idx, arr) => [inv.id, `FAC-${String(arr.length - idx).padStart(5, "0")}`])
  );

  const query = search.trim().toLowerCase();
  const filtered = invoices.filter((inv) => {
    if (tab === "Borrador" || tab === "Anuladas") return false;
    const status = computeStatus(inv);
    if (tab === "Pendientes" && status !== "Pendiente") return false;
    if (tab === "Pagadas" && status !== "Pagada") return false;
    if (tab === "Vencidas" && status !== "Vencida") return false;
    if (methodFilter !== "Todos" && inv.method !== methodFilter) return false;
    if (query) {
      const number = (numberById.get(inv.id) ?? "").toLowerCase();
      const matches = inv.clientName.toLowerCase().includes(query) || number.includes(query) || inv.concept.toLowerCase().includes(query);
      if (!matches) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((inv) => selected.has(inv.id));

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
      if (allOnPageSelected) pageItems.forEach((inv) => next.delete(inv.id));
      else pageItems.forEach((inv) => next.add(inv.id));
      return next;
    });
  }

  function handleBulkMarkPaid() {
    for (const id of selected) {
      const inv = invoices.find((i) => i.id === id);
      if (inv && inv.status !== "Pagada") markInvoicePaid(id);
    }
    setSelected(new Set());
  }

  const now = new Date();
  const scoped = period === "Este mes" ? invoices.filter((inv) => isInMonth(inv.date, now)) : invoices;
  const facturadoTotal = scoped.reduce((sum, inv) => sum + inv.amount, 0);
  const cobradoTotal = scoped.filter((inv) => computeStatus(inv) === "Pagada").reduce((sum, inv) => sum + inv.amount, 0);
  const pendienteTotal = scoped.filter((inv) => computeStatus(inv) === "Pendiente").reduce((sum, inv) => sum + inv.amount, 0);
  const vencidoTotal = scoped.filter((inv) => computeStatus(inv) === "Vencida").reduce((sum, inv) => sum + inv.amount, 0);

  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const monthLabel = (d: Date) => MONTHS_ES[d.getMonth()][0].toUpperCase() + MONTHS_ES[d.getMonth()].slice(1);
  const facturadoSeries = months.map((m) => ({
    label: monthLabel(m),
    value: invoices.filter((inv) => isInMonth(inv.date, m)).reduce((sum, inv) => sum + inv.amount, 0),
  }));
  const cobradoSeries = months.map((m) => ({
    label: monthLabel(m),
    value: invoices.filter((inv) => inv.status === "Pagada" && isInMonth(inv.date, m)).reduce((sum, inv) => sum + inv.amount, 0),
  }));

  const recentPayments = invoices
    .filter((inv) => inv.status === "Pagada")
    .sort((a, b) => (tryParseSpanishDate(b.date)?.getTime() ?? 0) - (tryParseSpanishDate(a.date)?.getTime() ?? 0))
    .slice(0, 4);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-sm text-ink-secondary mt-1.5">Gestiona todas tus facturas, pagos y cobros desde un solo lugar.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150 shrink-0"
        >
          <Plus size={15} />
          Nueva factura
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
              }}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                tab === t ? "bg-accent text-white shadow-sm" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {t}
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
            }}
            placeholder="Buscar factura, paciente o número…"
            className="pl-8 pr-3 py-2 w-full rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-colors ${
              methodFilter !== "Todos" ? "border-accent text-accent bg-accent-light" : "border-border text-ink-secondary hover:bg-plane"
            }`}
          >
            <SlidersHorizontal size={13} />
            {methodFilter === "Todos" ? "Filtros" : METHOD_LABEL[methodFilter]}
          </button>
          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                <button
                  onClick={() => {
                    setMethodFilter("Todos");
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                >
                  Todos los métodos
                  {methodFilter === "Todos" && <Check size={13} className="text-accent" />}
                </button>
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMethodFilter(m);
                      setPage(1);
                      setFiltersOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                  >
                    {METHOD_LABEL[m]}
                    {methodFilter === m && <Check size={13} className="text-accent" />}
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
            {selected.size} {selected.size === 1 ? "factura seleccionada" : "facturas seleccionadas"}
          </span>
          <div className="flex items-center gap-4">
            <button onClick={handleBulkMarkPaid} className="text-xs font-medium text-accent hover:underline">
              Marcar como pagadas
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-ink-secondary hover:underline">
              Cancelar selección
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
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
                <th className="py-2.5 px-3 min-w-[160px]">Factura</th>
                <th className="py-2.5 px-3 w-[130px]">Paciente</th>
                <th className="py-2.5 px-3 w-[85px]">Fecha</th>
                <th className="py-2.5 px-3 w-[95px]">Vencimiento</th>
                <th className="py-2.5 px-3 w-[90px]">Estado</th>
                <th className="py-2.5 px-3 w-[80px] text-right">Importe</th>
                <th className="py-2.5 px-3 w-[56px]"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((inv) => {
                const status = computeStatus(inv);
                return (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-plane transition-colors">
                    <td className="py-3 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleSelected(inv.id)}
                        style={{ accentColor: "#2a78d6" }}
                        className="w-3.5 h-3.5 rounded border-border"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Link href={`/facturacion/${inv.id}`} className="group block min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                          {numberById.get(inv.id)}
                        </p>
                        <p className="text-xs text-ink-muted truncate">{inv.concept || "—"}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent shrink-0">
                          {initials(inv.clientName)}
                        </span>
                        <p className="text-xs font-medium truncate">{inv.clientName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-secondary">{inv.date}</td>
                    <td className={`py-3 px-3 text-xs ${status === "Vencida" ? "text-critical font-medium" : "text-ink-secondary"}`}>
                      {dueDateLabel(inv)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="py-3 px-3 text-right font-medium tabular text-sm">{inv.amount}€</td>
                    <td className="py-3 px-3">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setMenuFor(menuFor === inv.id ? null : inv.id)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {menuFor === inv.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 top-8 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                              <Link
                                href={`/facturacion/${inv.id}`}
                                onClick={() => setMenuFor(null)}
                                className="block w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                              >
                                Ver factura
                              </Link>
                              {inv.status !== "Pagada" && (
                                <button
                                  onClick={() => {
                                    markInvoicePaid(inv.id);
                                    setMenuFor(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane"
                                >
                                  Marcar como pagada
                                </button>
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
                    No hay facturas que coincidan con los filtros.
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
                facturas
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

        <div className="space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Resumen de facturación</p>
              <div className="relative">
                <button
                  onClick={() => setPeriodOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-ink-secondary hover:text-ink px-2 py-1 rounded-md hover:bg-plane transition-colors"
                >
                  {period}
                  <ChevronDown size={12} />
                </button>
                {periodOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                    <div className="absolute right-0 mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg z-20 py-1.5">
                      {(["Este mes", "Todo"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setPeriod(p);
                            setPeriodOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm hover:bg-plane flex items-center justify-between gap-2"
                        >
                          {p}
                          {period === p && <Check size={13} className="text-accent" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Facturado" value={`${facturadoTotal}€`} tone="accent" />
              <StatTile label="Cobrado" value={`${cobradoTotal}€`} tone="good" />
              <StatTile label="Pendiente" value={`${pendienteTotal}€`} tone="warning" />
              <StatTile label="Vencido" value={`${vencidoTotal}€`} tone="critical" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Facturación por mes</p>
            <BarChart
              data={facturadoSeries}
              data2={cobradoSeries}
              color="#2a78d6"
              color2="#1baf7a"
              seriesLabel="Facturado"
              seriesLabel2="Cobrado"
              height={140}
              suffix="€"
            />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Pagos recientes</p>
            {recentPayments.length === 0 ? (
              <p className="text-xs text-ink-muted">Sin pagos todavía.</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-good-bg flex items-center justify-center shrink-0">
                      <Check size={13} className="text-good" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{inv.clientName}</p>
                      <p className="text-[11px] text-ink-muted truncate">{numberById.get(inv.id)}</p>
                    </div>
                    <span className="text-xs font-medium tabular shrink-0">{inv.amount}€</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <NewInvoiceModal open={addOpen} onClose={() => setAddOpen(false)} clients={clients} onCreate={addInvoice} />
    </div>
  );
}

function NewInvoiceModal({
  open,
  onClose,
  clients,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onCreate: (i: Invoice) => void;
}) {
  const [clientChoice, setClientChoice] = useState(clients[0]?.id ?? OTHER_OPTION);
  const [otherName, setOtherName] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Invoice["method"]>("Efectivo");
  const [insurer, setInsurer] = useState("");
  const [date, setDate] = useState(() => formatSpanishDate(new Date()));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isOther = clientChoice === OTHER_OPTION;
    const client = isOther ? null : clients.find((c) => c.id === clientChoice) ?? null;
    const clientName = isOther ? otherName.trim() : client?.name ?? "";
    if (!clientName || !concept.trim() || !date.trim()) return;

    onCreate({
      id: `inv-${Date.now()}`,
      date: date.trim(),
      clientId: client?.id ?? null,
      clientName,
      concept: concept.trim(),
      amount: Number(amount) || 0,
      method,
      insurer: method === "Seguro" ? insurer.trim() || undefined : undefined,
      status: "Pendiente",
    });

    setOtherName("");
    setConcept("");
    setAmount("");
    setInsurer("");
    setDate(formatSpanishDate(new Date()));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva factura">
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
        {clientChoice === OTHER_OPTION && (
          <div>
            <FieldLabel>Nombre del paciente</FieldLabel>
            <input required value={otherName} onChange={(e) => setOtherName(e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <FieldLabel>Concepto</FieldLabel>
          <input required value={concept} onChange={(e) => setConcept(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Importe (€)</FieldLabel>
            <input
              required
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <input required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} placeholder="13 jul 2026" />
          </div>
        </div>
        <div>
          <FieldLabel>Método</FieldLabel>
          <select value={method} onChange={(e) => setMethod(e.target.value as Invoice["method"])} className={inputClass}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        {method === "Seguro" && (
          <div>
            <FieldLabel>Aseguradora</FieldLabel>
            <input value={insurer} onChange={(e) => setInsurer(e.target.value)} className={inputClass} />
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-2 px-4 py-2.5 bg-ink text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-150"
        >
          Crear factura
        </button>
      </form>
    </Modal>
  );
}
