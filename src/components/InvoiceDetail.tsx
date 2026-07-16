"use client";

import Link from "next/link";
import { ArrowLeft, Check, User } from "lucide-react";
import { Card, StatusBadge } from "@/components/ui";
import { useAppData } from "@/lib/store";
import { parseSpanishDate, formatSpanishDate, addDays } from "@/lib/dates";
import type { Invoice } from "@/lib/types";

const METHOD_LABEL: Record<string, string> = {
  Efectivo: "Efectivo",
  Tarjeta: "Tarjeta",
  Seguro: "Seguro médico",
  Financiado: "Financiado",
};

const DUE_DAYS = 14;

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

function computeStatus(inv: Invoice): "Pendiente" | "Pagada" | "Vencida" {
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

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { invoices, markInvoicePaid } = useAppData();
  const invoice = invoices.find((i) => i.id === invoiceId);

  if (!invoice) {
    return (
      <div className="max-w-2xl">
        <Link href="/facturacion" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6">
          <ArrowLeft size={15} />
          Volver a facturación
        </Link>
        <p className="text-sm text-ink-muted">Esta factura ya no existe.</p>
      </div>
    );
  }

  const sortedIds = invoices
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((i) => i.id);
  const index = sortedIds.indexOf(invoiceId);
  const number = `FAC-${String(sortedIds.length - index).padStart(5, "0")}`;
  const status = computeStatus(invoice);

  return (
    <div className="max-w-2xl">
      <Link href="/facturacion" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-6">
        <ArrowLeft size={15} />
        Volver a facturación
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{number}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-ink-secondary mt-1.5">{invoice.concept || "Sin concepto"}</p>
        </div>
        {status !== "Pagada" && (
          <button
            onClick={() => markInvoicePaid(invoice.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all duration-150 shrink-0"
          >
            <Check size={15} />
            Marcar como pagada
          </button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between pb-5 border-b border-border mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-full bg-accent-light flex items-center justify-center text-sm font-semibold text-accent shrink-0">
              {initials(invoice.clientName)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{invoice.clientName}</p>
              {invoice.clientId ? (
                <Link
                  href={`/pacientes/${invoice.clientId}`}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <User size={11} />
                  Ver ficha de paciente
                </Link>
              ) : (
                <p className="text-xs text-ink-muted">Paciente sin ficha vinculada</p>
              )}
            </div>
          </div>
          <p className="text-2xl font-bold tabular shrink-0">{invoice.amount}€</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-1">Fecha de emisión</p>
            <p className="text-sm font-medium">{invoice.date}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-1">Vencimiento</p>
            <p className={`text-sm font-medium ${status === "Vencida" ? "text-critical" : ""}`}>{dueDateLabel(invoice)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-1">Método de pago</p>
            <p className="text-sm font-medium">
              {METHOD_LABEL[invoice.method]}
              {invoice.insurer ? ` · ${invoice.insurer}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-1">Estado</p>
            <StatusBadge status={status} />
          </div>
        </div>
      </Card>
    </div>
  );
}
