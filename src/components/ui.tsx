import type { ComponentType } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Sparkline } from "@/components/charts/Sparkline";

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className={`bg-surface border border-border rounded-2xl w-full p-6 max-h-[85vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">{title}</h2>
            <button onClick={onClose} className="text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-ink-secondary block mb-1.5">{children}</label>;
}

export const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

export function RowInput({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-2.5 py-1.5 rounded-lg border border-transparent hover:border-border focus:border-accent bg-transparent focus:bg-surface text-sm focus:outline-none transition-colors ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl shadow-[0_2px_10px_rgba(11,11,11,0.07),0_1px_3px_rgba(11,11,11,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-secondary mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "accent" | "good" | "warning" | "critical" | "violet" | "teal" | "serious";

const CHIP_TONE_STYLES: Record<Tone, { bg: string; text: string }> = {
  accent: { bg: "bg-accent-light", text: "text-accent" },
  good: { bg: "bg-good-bg", text: "text-good" },
  warning: { bg: "bg-warning-bg", text: "text-[#946200]" },
  critical: { bg: "bg-critical-bg", text: "text-critical" },
  violet: { bg: "bg-violet-bg", text: "text-violet" },
  teal: { bg: "bg-teal-bg", text: "text-teal" },
  serious: { bg: "bg-serious-bg", text: "text-serious" },
};

const TONE_CHART_COLOR: Record<Tone, string> = {
  accent: "#2a78d6",
  good: "#1baf7a",
  warning: "#e08a3c",
  critical: "#e5484d",
  violet: "#7c3aed",
  teal: "#0d9488",
  serious: "#ec835a",
};

export function StatTile({
  label,
  value,
  delta,
  deltaGood = true,
  deltaHref,
  trend,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  deltaHref?: string;
  trend?: number[];
  icon?: ComponentType<{ size?: number; className?: string }>;
  tone?: Tone;
}) {
  const style = CHIP_TONE_STYLES[tone];
  const deltaClass = `text-xs font-medium mt-2 ${deltaGood ? "text-good" : "text-critical"}`;
  return (
    <div className="bg-[#fafafa] border border-border/70 rounded-2xl shadow-[0_1px_3px_rgba(11,11,11,0.05),0_1px_2px_rgba(11,11,11,0.04)] p-5 overflow-hidden">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
            <Icon size={17} className={style.text} />
          </span>
        )}
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide truncate">{label}</p>
      </div>
      <p className="text-[34px] leading-none font-medium tabular tracking-tight mt-3">{value}</p>
      {delta && deltaHref ? (
        <Link href={deltaHref} className={`${deltaClass} inline-block hover:underline`}>
          {delta}
        </Link>
      ) : (
        delta && <p className={deltaClass}>{delta}</p>
      )}
      {trend && (
        <div className="-mx-5 -mb-5 mt-3">
          <Sparkline data={trend} width={200} height={36} color={TONE_CHART_COLOR[tone]} area responsive />
        </div>
      )}
    </div>
  );
}

export function HighlightChip({
  icon: Icon,
  value,
  label,
  tone = "accent",
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
  tone?: Tone;
}) {
  const style = CHIP_TONE_STYLES[tone];
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
        <Icon size={18} className={style.text} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none tabular tracking-tight">{value}</p>
        <p className="text-xs text-ink-muted mt-1.5 truncate">{label}</p>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  Activo: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Sincronizado: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Confirmada: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Completada: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Pendiente: { dot: "bg-warning", bg: "bg-warning-bg", text: "text-[#946200]" },
  Vencida: { dot: "bg-warning", bg: "bg-warning-bg", text: "text-[#946200]" },
  Pausado: { dot: "bg-ink-muted", bg: "bg-plane", text: "text-ink-secondary" },
  Cancelada: { dot: "bg-critical", bg: "bg-critical-bg", text: "text-critical" },
  Rechazado: { dot: "bg-critical", bg: "bg-critical-bg", text: "text-critical" },
  Aprobado: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Realizado: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Pagada: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Nuevo: { dot: "bg-accent", bg: "bg-accent-light", text: "text-accent" },
  Modificada: { dot: "bg-accent", bg: "bg-accent-light", text: "text-accent" },
  Inactivo: { dot: "bg-ink-muted", bg: "bg-plane", text: "text-ink-secondary" },
  Enviado: { dot: "bg-accent", bg: "bg-accent-light", text: "text-accent" },
  Aceptado: { dot: "bg-good", bg: "bg-good-bg", text: "text-good" },
  Caducado: { dot: "bg-warning", bg: "bg-warning-bg", text: "text-[#946200]" },
  Borrador: { dot: "bg-ink-muted", bg: "bg-plane", text: "text-ink-secondary" },
  "En seguimiento": { dot: "bg-violet", bg: "bg-violet-bg", text: "text-violet" },
  "Presupuesto pendiente": { dot: "bg-warning", bg: "bg-warning-bg", text: "text-[#946200]" },
  Reactivar: { dot: "bg-critical", bg: "bg-critical-bg", text: "text-critical" },
  "En proceso": { dot: "bg-accent", bg: "bg-accent-light", text: "text-accent" },
  Programada: { dot: "bg-violet", bg: "bg-violet-bg", text: "text-violet" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { dot: "bg-ink-muted", bg: "bg-plane", text: "text-ink-secondary" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
