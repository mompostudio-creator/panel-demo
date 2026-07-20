"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Info,
  UserPlus,
  CalendarPlus,
  CalendarX,
  CalendarClock,
  CalendarCheck,
  FileText,
  FileCheck,
  FileX,
  Receipt,
  CircleDollarSign,
  Wallet,
  UserX,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Calendar,
  User,
  Users,
  Euro,
  Percent,
  Database,
  Bot,
  Clock,
} from "lucide-react";
import { Card, StatTile, StatusBadge } from "@/components/ui";
import { BarChart } from "@/components/charts/BarChart";
import { useAppData } from "@/lib/store";
import { computeAppointmentSeries } from "@/lib/analytics";
import {
  formatRelativeTime,
  formatSpanishDate,
  fromISODate,
  getGreeting,
  isSameDay,
  parseSpanishDate,
  toISODate,
} from "@/lib/dates";
import { getAvailableSlotsAction } from "@/lib/actions";
import { CLIENT_BUSINESS_NAME, DEMO_AI_CONVERSATIONS_TODAY, DEMO_AI_CONVERSATIONS_DELTA, DEMO_WHATSAPP_MESSAGES } from "@/lib/branding";

// Curvas ilustrativas para los KPIs que aún no tienen una serie histórica real
// (presupuestos, ingresos, ocupación). Solo para mostrar cómo quedaría el gráfico.
const ILLUSTRATIVE_TREND = [4, 5, 4.4, 5.6, 5, 6.2, 6.8];

const EVENT_ICONS: Record<string, typeof Clock> = {
  nuevo_paciente: UserPlus,
  cita_creada: CalendarPlus,
  cita_cancelada: CalendarX,
  cita_reagendada: CalendarClock,
  cita_completada: CalendarCheck,
  presupuesto_creado: FileText,
  presupuesto_aprobado: FileCheck,
  presupuesto_rechazado: FileX,
  factura_creada: Receipt,
  factura_cobrada: CircleDollarSign,
};

const OPERATION_TONE_STYLES: Record<"accent" | "warning" | "critical", { bg: string; text: string }> = {
  accent: { bg: "bg-accent-light", text: "text-accent" },
  warning: { bg: "bg-warning-bg", text: "text-[#946200]" },
  critical: { bg: "bg-critical-bg", text: "text-critical" },
};

function OperationRow({
  icon: Icon,
  tone,
  title,
  subtitle,
  href,
}: {
  icon: typeof Clock;
  tone: "accent" | "warning" | "critical";
  title: string;
  subtitle?: string;
  href: string;
}) {
  const style = OPERATION_TONE_STYLES[tone];
  return (
    <Link href={href} className={`flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80 ${style.bg}`}>
      <span className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
        <Icon size={16} className={style.text} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {subtitle && <p className="text-xs text-ink-secondary truncate mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight size={16} className={`${style.text} shrink-0`} />
    </Link>
  );
}

function SystemStatusRow({
  icon: Icon,
  label,
  active,
  activeLabel = "Activo",
  inactiveLabel = "Disponible",
}: {
  icon: typeof Clock;
  label: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-good-bg" : "bg-plane"}`}>
        <Icon size={14} className={active ? "text-good" : "text-ink-muted"} />
      </span>
      <span className="text-sm text-ink-secondary flex-1">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-good" : "text-ink-muted"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-good animate-pulse" : "bg-ink-muted"}`} />
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}

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

function joinWithY(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

export function DashboardClient() {
  const { clients, appointments, invoices, quotes, activityLog, automations, lastSyncedAt } = useAppData();
  const [occupancy, setOccupancy] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  const selectedDateLabel = formatSpanishDate(selectedDate);

  const todayAppointments = appointments
    .filter((a) => a.date === selectedDateLabel && a.status !== "Cancelada")
    .sort((a, b) => a.time.localeCompare(b.time));

  const activeClients = clients.filter((c) => c.status !== "Inactivo").length;
  const pendingQuotes = quotes.filter((q) => q.status === "Pendiente").length;
  const pendingInvoices = invoices.filter((i) => i.status === "Pendiente");
  const clientsWithoutNextAppt = clients.filter((c) => c.status === "Activo" && !c.nextAppointment);

  const urgentQuotesCount = quotes.filter((q) => {
    if (q.status !== "Pendiente") return false;
    const d = tryParseSpanishDate(q.validUntil);
    return d ? d.getTime() < now.getTime() : false;
  }).length;

  let currentMonthRevenue = 0;
  let previousMonthRevenue = 0;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  for (const inv of invoices) {
    if (inv.status !== "Pagada") continue;
    const d = tryParseSpanishDate(inv.date);
    if (!d) continue;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) currentMonthRevenue += inv.amount;
    else if (d.getFullYear() === prevMonth.getFullYear() && d.getMonth() === prevMonth.getMonth()) previousMonthRevenue += inv.amount;
  }
  const revenueDeltaPct = previousMonthRevenue > 0 ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : null;

  const occupancyTone = occupancy === null ? "accent" : occupancy >= 70 ? "good" : occupancy >= 40 ? "warning" : "critical";

  useEffect(() => {
    let cancelled = false;
    getAvailableSlotsAction(toISODate(selectedDate))
      .then((freeSlots) => {
        if (cancelled) return;
        const booked = todayAppointments.length;
        const total = booked + freeSlots.length;
        setOccupancy(total > 0 ? Math.round((booked / total) * 100) : null);
      })
      .catch(() => setOccupancy(null));
    return () => {
      cancelled = true;
    };
  }, [selectedDate, todayAppointments.length]);

  const { appointmentsSeries, cancellationsSeries, newClientsSeries } = computeAppointmentSeries(appointments);
  const shortLabel = (date: string) => date.replace(/ \d{4}$/, "");
  const appointmentsBars = appointmentsSeries.slice(-7).map((d) => ({ label: shortLabel(d.date), value: d.value }));
  const newClientsBars = newClientsSeries.slice(-7).map((d) => ({ label: shortLabel(d.date), value: d.value }));
  const cancellationsBars = cancellationsSeries.slice(-7).map((d) => ({ label: shortLabel(d.date), value: d.value }));
  const appointmentsTrend = appointmentsBars.length > 1 ? appointmentsBars.map((b) => b.value) : undefined;
  const newClientsTrend = newClientsBars.length > 1 ? newClientsBars.map((b) => b.value) : undefined;

  const newClientsThisMonth = newClientsSeries
    .filter((d) => {
      const dt = tryParseSpanishDate(d.date);
      return dt && dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    })
    .reduce((sum, d) => sum + d.value, 0);

  const previousDay = new Date(selectedDate);
  previousDay.setDate(selectedDate.getDate() - 1);
  const previousDayLabel = formatSpanishDate(previousDay);
  const previousDayAppointments = appointmentsSeries.find((d) => d.date === previousDayLabel)?.value ?? 0;
  const citasDelta = todayAppointments.length - previousDayAppointments;

  const whatsappActive = automations.find((a) => a.name === "WhatsApp IA")?.status === "Activo";
  const calendarActive = automations.find((a) => a.name === "Google Calendar")?.status === "Activo";
  const activeAutomations = automations.filter((a) => a.status === "Activo").slice(0, 4);

  const whatsappClients = clients.filter((c) => c.channel === "WhatsApp").slice(0, 3);
  const whatsappPreview = (whatsappClients.length > 0 ? whatsappClients : clients.slice(0, 3)).map((c, i) => ({
    client: c,
    ...DEMO_WHATSAPP_MESSAGES[i % DEMO_WHATSAPP_MESSAGES.length],
  }));

  const operationItems = [
    pendingQuotes > 0
      ? {
          icon: FileText,
          tone: "warning" as const,
          title: `${pendingQuotes} presupuesto${pendingQuotes === 1 ? "" : "s"} sin responder`,
          subtitle: urgentQuotesCount > 0 ? `${urgentQuotesCount} caducado${urgentQuotesCount === 1 ? "" : "s"}` : undefined,
          href: "/presupuestos",
        }
      : null,
    pendingInvoices.length > 0
      ? {
          icon: Wallet,
          tone: "critical" as const,
          title: `${pendingInvoices.length} factura${pendingInvoices.length === 1 ? "" : "s"} pendiente${pendingInvoices.length === 1 ? "" : "s"} de cobro`,
          subtitle: `${pendingInvoices[0].clientName} · ${pendingInvoices[0].amount}€`,
          href: "/facturacion",
        }
      : null,
    clientsWithoutNextAppt.length > 0
      ? {
          icon: UserX,
          tone: "accent" as const,
          title: `${clientsWithoutNextAppt.length} paciente${clientsWithoutNextAppt.length === 1 ? "" : "s"} sin próxima cita`,
          subtitle: clientsWithoutNextAppt[0].name,
          href: "/pacientes",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const lastAutomation = activityLog[0];

  const summaryParts = [
    `${todayAppointments.length} cita${todayAppointments.length === 1 ? "" : "s"}`,
    `${pendingQuotes} presupuesto${pendingQuotes === 1 ? "" : "s"} pendiente${pendingQuotes === 1 ? "" : "s"}`,
    ...(pendingInvoices.length > 0
      ? [`${pendingInvoices.length} factura${pendingInvoices.length === 1 ? "" : "s"} por cobrar`]
      : []),
  ];
  const summaryIntro = isToday ? "Hoy tienes" : `El ${selectedDateLabel} tienes`;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {CLIENT_BUSINESS_NAME} 👋
          </h1>
          <p className="text-sm text-ink-secondary mt-1.5">
            {summaryIntro} {joinWithY(summaryParts)}.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <label className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 cursor-pointer">
            <Calendar size={14} className="text-ink-muted shrink-0" />
            <input
              type="date"
              value={toISODate(selectedDate)}
              onChange={(e) => e.target.value && setSelectedDate(fromISODate(e.target.value))}
              className="text-sm bg-transparent outline-none tabular"
            />
          </label>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3.5 py-2 text-sm font-medium bg-surface border border-border rounded-xl hover:bg-plane transition-colors"
          >
            Hoy
          </button>
          <Link
            href="/configuracion"
            className="w-9 h-9 rounded-full bg-plane border border-border flex items-center justify-center text-ink-secondary hover:bg-border/40 transition-colors shrink-0"
          >
            <User size={16} />
          </Link>
        </div>
      </div>

      <Card className="p-4 flex items-start gap-3 bg-accent-light border-none">
        <Info size={16} className="text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-ink-secondary">
          Estás viendo una configuración de ejemplo. Cada sistema de <span className="font-medium text-ink">MompoStudio OS</span> se
          implementa a medida, con los módulos y departamentos que tu empresa realmente necesita.
        </p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile
          label="Pacientes activos"
          value={String(activeClients)}
          trend={newClientsTrend}
          icon={Users}
          tone="accent"
          delta={newClientsThisMonth > 0 ? `+${newClientsThisMonth} este mes` : undefined}
          deltaGood
        />
        <StatTile
          label={isToday ? "Citas hoy" : "Citas ese día"}
          value={String(todayAppointments.length)}
          trend={appointmentsTrend}
          icon={CalendarCheck}
          tone="accent"
          delta={citasDelta !== 0 ? `${citasDelta > 0 ? "+" : ""}${citasDelta} vs día anterior` : undefined}
          deltaGood={citasDelta >= 0}
        />
        <StatTile
          label="Presupuestos pendientes"
          value={String(pendingQuotes)}
          trend={ILLUSTRATIVE_TREND}
          icon={FileText}
          tone="warning"
          delta={urgentQuotesCount > 0 ? `${urgentQuotesCount} caducado${urgentQuotesCount === 1 ? "" : "s"}` : undefined}
          deltaGood={false}
        />
        <StatTile
          label="Ingresos del mes"
          value={`${currentMonthRevenue}€`}
          trend={ILLUSTRATIVE_TREND}
          icon={Euro}
          tone="good"
          delta={revenueDeltaPct !== null ? `${revenueDeltaPct >= 0 ? "+" : ""}${revenueDeltaPct}% vs mes pasado` : undefined}
          deltaGood={revenueDeltaPct !== null && revenueDeltaPct >= 0}
        />
        <StatTile
          label="Tasa de ocupación"
          value={occupancy !== null ? `${occupancy}%` : "—"}
          trend={ILLUSTRATIVE_TREND}
          icon={Percent}
          tone={occupancyTone}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight">Centro de operaciones</h2>
            <Link href="/pipeline" className="text-xs font-medium text-accent hover:underline">
              Ver pipeline
            </Link>
          </div>
          {operationItems.length > 0 ? (
            <div className="space-y-2.5">
              {operationItems.map((item) => (
                <OperationRow key={item.title} {...item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Todo al día. No hay nada pendiente de tu atención ahora mismo.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold tracking-tight">
              {isToday ? "Agenda de hoy" : `Agenda del ${selectedDateLabel}`}
            </h2>
            <Link href="/agenda" className="text-xs font-medium text-accent hover:underline">
              Ver agenda
            </Link>
          </div>
          <div className="relative space-y-1">
            {todayAppointments.length === 0 && (
              <p className="text-sm text-ink-muted">No hay citas {isToday ? "hoy" : "ese día"}.</p>
            )}
            {todayAppointments.length > 0 && (
              <div className="absolute left-[76px] top-2 bottom-2 w-px bg-border" aria-hidden />
            )}
            {todayAppointments.map((a) => (
              <Link
                key={a.id}
                href={a.clientId ? `/pacientes/${a.clientId}` : "#"}
                className="relative flex items-center gap-4 py-3 px-3 -mx-3 rounded-lg hover:bg-plane transition-colors"
              >
                <span className="relative z-10 text-sm font-medium tabular w-14 text-ink-muted">{a.time}</span>
                <span className="relative z-10 w-2 h-2 rounded-full bg-accent shrink-0 ring-4 ring-surface" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{a.clientName}</p>
                  <p className="text-xs text-ink-muted truncate">{a.service}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-bold tracking-tight mb-4">Estado del sistema</h2>
          <div className="divide-y divide-border">
            <SystemStatusRow icon={Database} label="Base de datos" active activeLabel="Sincronizado" />
            <SystemStatusRow icon={MessageCircle} label="WhatsApp" active={whatsappActive} activeLabel="Conectado" />
            <SystemStatusRow icon={Bot} label="IA / Agente" active={whatsappActive} activeLabel="Operativo" />
            <SystemStatusRow icon={CalendarClock} label="Google Calendar" active={calendarActive} activeLabel="Sincronizado" />
          </div>
          <p className="text-xs text-ink-muted mt-4 pt-4 border-t border-border flex items-center gap-1.5">
            <RefreshCw size={12} />
            Última sincronización: {formatRelativeTime(lastSyncedAt)}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight">Actividad reciente</h2>
            <Link href="/actividades" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-1">
            {activityLog.slice(0, 5).map((a, i) => {
              const Icon = (a.eventType && EVENT_ICONS[a.eventType]) || Clock;
              return (
                <div key={i} className="flex gap-2.5 items-center py-1.5">
                  <span className="w-7 h-7 rounded-full bg-plane flex items-center justify-center shrink-0">
                    <Icon size={12} className="text-ink-secondary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    {a.actorName && <p className="text-xs font-semibold truncate">{a.actorName}</p>}
                    <p className="text-xs text-ink-secondary truncate">{a.label}</p>
                  </div>
                  <span className="text-[11px] text-ink-muted tabular shrink-0">{formatRelativeTime(a.createdAt)}</span>
                </div>
              );
            })}
            {activityLog.length === 0 && <p className="text-sm text-ink-muted">Sin actividad todavía.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Automatizaciones activas
            </h2>
            <Link href="/automatizaciones" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          {activeAutomations.length > 0 ? (
            <div className="space-y-3.5">
              {activeAutomations.map((a) => (
                <div key={a.name} className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Ninguna activa todavía.{" "}
              <Link href="/automatizaciones" className="text-accent hover:underline">
                Actívalas aquí
              </Link>
              .
            </p>
          )}
          {lastAutomation && (
            <p className="text-xs text-ink-muted mt-4 pt-4 border-t border-border">
              Última automatización: {formatRelativeTime(lastAutomation.createdAt)}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2 mb-1">
            <MessageCircle size={16} className="text-good" />
            Conversaciones por WhatsApp
          </h2>
          <div className="flex items-center gap-2 mt-3 mb-4">
            <p className="text-3xl font-bold tabular tracking-tight">{DEMO_AI_CONVERSATIONS_TODAY}</p>
            <span className="text-xs text-ink-muted">activas hoy</span>
            <span className="text-xs font-medium text-good bg-good-bg px-2 py-0.5 rounded-full ml-auto">
              {DEMO_AI_CONVERSATIONS_DELTA}
            </span>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            {whatsappPreview.map(({ client, text, minutesAgo }) => (
              <div key={client.id} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-full bg-plane flex items-center justify-center shrink-0 text-[10px] font-semibold text-ink-secondary">
                  {initials(client.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{client.name}</p>
                  <p className="text-xs text-ink-secondary truncate">{text}</p>
                </div>
                <span className="text-[11px] text-ink-muted shrink-0">{minutesAgo === 0 ? "ahora" : `hace ${minutesAgo} min`}</span>
              </div>
            ))}
            {whatsappPreview.length === 0 && <p className="text-xs text-ink-muted">Sin conversaciones recientes.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold tracking-tight">Estadísticas rápidas</h2>
          <Link href="/analitica" className="text-xs font-medium text-accent hover:underline">
            Ver analítica
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-2">Citas realizadas</p>
            <BarChart data={appointmentsBars} height={90} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-2">Pacientes nuevos</p>
            <BarChart data={newClientsBars} height={90} color="#1baf7a" />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-secondary mb-2">Cancelaciones</p>
            <BarChart data={cancellationsBars} height={90} color="#ec835a" />
          </div>
        </div>
      </Card>
    </div>
  );
}
