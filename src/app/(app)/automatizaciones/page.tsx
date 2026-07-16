import { Sparkles } from "lucide-react";
import { getAutomationsView } from "@/lib/data";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";

export default async function AutomatizacionesPage() {
  const automations = await getAutomationsView();
  const active = automations.filter((a) => a.status === "Activo");
  const available = automations.filter((a) => a.status === "Disponible");

  return (
    <div className="max-w-4xl space-y-8">
      <SectionTitle title="Automatizaciones" subtitle="Procesos que trabajan por ti, sin que tengas que hacer nada" />

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">Activas ahora</p>
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((mod) => (
              <Card key={mod.name} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{mod.name}</p>
                  <p className="text-xs text-ink-secondary mt-1">{mod.description}</p>
                </div>
                <StatusBadge status={mod.status} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">Disponibles para activar</p>
          <div className="grid md:grid-cols-2 gap-4">
            {available.map((mod) => (
              <Card key={mod.name} className="p-5 flex items-start justify-between gap-4 border-dashed">
                <div>
                  <p className="text-sm font-semibold">{mod.name}</p>
                  <p className="text-xs text-ink-secondary mt-1">{mod.description}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-plane text-ink-secondary shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                  Disponible
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="p-5 flex items-start gap-3 bg-accent-light border-none">
        <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-ink-secondary">
          Además de estas, se puede crear <span className="font-medium text-ink">cualquier automatización que tu negocio necesite</span> —
          cada sistema de MompoStudio OS se diseña a medida, con las herramientas, mensajes y procesos concretos de tu clínica o negocio.
        </p>
      </Card>
    </div>
  );
}
