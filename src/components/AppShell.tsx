"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarRange,
  ListChecks,
  Kanban,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  ReceiptEuro,
  FileSpreadsheet,
  Calculator,
  ShieldCheck,
  FlaskConical,
  Package,
  UserCog,
  Sparkles,
  Mail,
  MessageCircle,
  UserCircle,
} from "lucide-react";

const INICIO_ITEM = { href: "/inicio", label: "Inicio", icon: Home };

const NAV_GROUPS = [
  {
    label: "Atención al paciente",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pacientes", label: "Pacientes", icon: Users },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/citas", label: "Citas", icon: CalendarCheck },
      { href: "/agenda", label: "Agenda", icon: CalendarRange },
      { href: "/actividades", label: "Actividades", icon: ListChecks },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/facturacion", label: "Facturación", icon: ReceiptEuro },
      { href: "/presupuestos", label: "Presupuestos", icon: FileSpreadsheet },
    ],
  },
];

const LOCKED_GROUPS = [
  {
    label: "Operaciones",
    items: [
      { label: "Automatizaciones", icon: Zap },
      { label: "Analítica", icon: BarChart3 },
      { label: "Configuración", icon: Settings },
    ],
  },
  {
    label: "Comunicación y equipo",
    items: [
      { label: "Correo", icon: Mail },
      { label: "WhatsApp", icon: MessageCircle },
      { label: "Usuarios", icon: UserCircle },
    ],
  },
  {
    label: "Departamentos",
    items: [
      { label: "Contabilidad", icon: Calculator },
      { label: "Inventario médico", icon: Package },
      { label: "Cumplimiento y RGPD", icon: ShieldCheck },
      { label: "Laboratorio", icon: FlaskConical },
      { label: "RR. HH.", icon: UserCog },
    ],
  },
];

export function AppShell({
  children,
  companyName,
  onLogout,
}: {
  children: React.ReactNode;
  companyName: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-plane">
      <aside className="w-64 shrink-0 flex flex-col z-10 bg-surface border-r border-border">
        <div className="px-6 pt-8 pb-7 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-accent to-violet">
            <Sparkles size={16} strokeWidth={2.25} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-[15px] leading-tight text-ink">{companyName}</p>
            <p className="text-xs mt-0.5 text-ink-muted">Panel de control</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-8 overflow-y-auto">
          <div>
            <Link
              href={INICIO_ITEM.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === INICIO_ITEM.href
                  ? "bg-accent-light text-accent font-medium"
                  : "text-ink-secondary hover:bg-black/[0.04] hover:text-ink"
              }`}
            >
              <Home size={17} strokeWidth={2} />
              {INICIO_ITEM.label}
            </Link>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active ? "bg-accent-light text-accent font-medium" : "text-ink-secondary hover:bg-black/[0.04] hover:text-ink"
                      }`}
                    >
                      <Icon size={17} strokeWidth={2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {LOCKED_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted/70 cursor-default">
                      <Icon size={17} strokeWidth={2} />
                      <span className="flex-1">{mod.label}</span>
                      <Lock size={12} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-3 mt-2 border-t border-border">
          <form action={onLogout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-secondary hover:bg-black/[0.04] hover:text-ink transition-colors"
            >
              <LogOut size={17} strokeWidth={2} />
              Cerrar sesión
            </button>
          </form>
          <p className="text-[11px] px-3 pt-3 text-ink-muted">MompoStudio OS · v1.0</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-10 pt-12 pb-8">{children}</main>
    </div>
  );
}
