import {
  Building2,
  Stethoscope,
  Tag,
  CheckCircle2,
  Monitor,
  LayoutGrid,
  SlidersHorizontal,
  Layers,
  Target,
  Database,
  Clock,
  TrendingUp,
  Users2,
  Zap,
  Sparkles,
  MessageCircle,
  Link2,
  ShieldCheck,
  Check,
  Info,
} from "lucide-react";
import { CLIENT_BUSINESS_NAME } from "@/lib/branding";

const IMPLEMENTED_MODULES = [
  "Dashboard",
  "Pacientes",
  "Pipeline",
  "Agenda",
  "Citas",
  "Actividades",
  "Presupuestos",
  "Facturación",
];

const PERSONALIZATION_ITEMS = [
  "Nuevos departamentos y equipos",
  "Nuevos módulos y funcionalidades",
  "Automatizaciones específicas",
  "Agentes de IA personalizados",
  "Integraciones con tus herramientas",
  "Permisos y roles personalizados",
  "Dashboards y reportes a medida",
];

const TECH_STACK = [
  { name: "Supabase", description: "Base de datos en tiempo real", icon: Database },
  { name: "n8n", description: "Automatización de procesos", icon: Zap },
  { name: "IA", description: "Agentes inteligentes y asistentes", icon: Sparkles },
  { name: "WhatsApp", description: "Comunicación integrada", icon: MessageCircle },
  { name: "Integraciones", description: "Conecta tus herramientas favoritas", icon: Link2 },
  { name: "Seguridad", description: "Datos protegidos y encriptados", icon: ShieldCheck },
];

const OBJECTIVE_STATS = [
  { label: "Información centralizada", icon: Database },
  { label: "Ahorro de tiempo", icon: Clock },
  { label: "Mejores decisiones", icon: TrendingUp },
  { label: "Equipos más productivos", icon: Users2 },
];

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
          <Icon size={17} className="text-accent" />
        </span>
        <p className="text-base font-semibold">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function InicioPage() {
  return (
    <div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6 items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            👋 Bienvenido a <span className="text-accent">MompoStudio OS</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-3 leading-relaxed max-w-2xl">
            Esta es una implementación de ejemplo de MompoStudio OS para una clínica dental. Cada sistema se diseña y desarrolla
            específicamente para adaptarse a los procesos, departamentos y necesidades de cada empresa.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-accent" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Implementación actual</p>
              <p className="text-base font-bold truncate">{CLIENT_BUSINESS_NAME}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted inline-flex items-center gap-1.5">
                <Stethoscope size={13} />
                Sector
              </span>
              <span className="font-medium">Salud</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted inline-flex items-center gap-1.5">
                <Tag size={13} />
                Versión
              </span>
              <span className="font-medium">Demo v1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Estado
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-good-bg text-good">
                <span className="w-1.5 h-1.5 rounded-full bg-good" />
                Sistema operativo funcional
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6 items-start">
        <SectionCard icon={Monitor} title="¿Qué es MompoStudio OS?">
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">
            MompoStudio OS es un sistema operativo empresarial diseñado para centralizar, conectar y automatizar todos los
            procesos de una empresa.
          </p>
          <ul className="space-y-2.5">
            {[
              "Centraliza toda la información en un único lugar",
              "Automatiza tareas repetitivas y procesos manuales",
              "Mejora la colaboración entre equipos y departamentos",
              "Proporciona datos en tiempo real para tomar mejores decisiones",
              "Escalable y adaptable a cualquier tipo de negocio",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm">
                <Check size={14} className="text-good shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={LayoutGrid} title="Módulos implementados">
          <div className="space-y-2">
            {IMPLEMENTED_MODULES.map((label) => (
              <div key={label} className="flex items-center justify-between text-sm py-1">
                <span>{label}</span>
                <Check size={15} className="text-good" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={SlidersHorizontal} title="Personalización">
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">
            Cada implementación se adapta 100% a las necesidades de tu empresa. Podemos incluir:
          </p>
          <ul className="space-y-2.5">
            {PERSONALIZATION_ITEMS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm">
                <Check size={14} className="text-accent shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6 items-start">
        <SectionCard icon={Layers} title="Tecnologías utilizadas">
          <div className="grid grid-cols-2 gap-4">
            {TECH_STACK.map((tech) => {
              const Icon = tech.icon;
              return (
                <div key={tech.name} className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-plane flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-ink-secondary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{tech.name}</p>
                    <p className="text-xs text-ink-muted">{tech.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Target} title="Objetivo del sistema">
          <p className="text-sm text-ink-secondary leading-relaxed mb-5">
            Eliminar el caos de la información dispersa y los procesos manuales. Todo tu negocio conectado en un solo sistema
            para que tu equipo pueda centrarse en lo que realmente importa: hacer crecer la empresa y cuidar de tus pacientes.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {OBJECTIVE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-violet-bg flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-violet" />
                  </span>
                  <span className="text-xs font-medium text-ink-secondary">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="flex items-start gap-3 bg-accent-light border border-accent/20 rounded-2xl p-4">
        <Info size={18} className="text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-ink">
          <span className="font-medium">Importante: </span>
          Esta es una demostración con datos de ejemplo. En una implementación real, todo el sistema se configurará según los
          procesos y necesidades específicas de tu empresa.
        </p>
      </div>
    </div>
  );
}
