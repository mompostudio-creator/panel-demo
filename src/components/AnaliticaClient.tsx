"use client";

import { Card, SectionTitle, StatTile } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { useAppData } from "@/lib/store";
import { computeAppointmentSeries, computeChannelBreakdown, computeWeeklyOccupancy, computeReviews } from "@/lib/analytics";

export function AnaliticaClient() {
  const { appointments, clients, pipelineCards } = useAppData();

  const { appointmentsSeries, cancellationsSeries, newClientsSeries } = computeAppointmentSeries(appointments);
  const channelBreakdown = computeChannelBreakdown(clients);
  const weeklyOccupancy = computeWeeklyOccupancy(appointments);
  const reviews = computeReviews(clients);

  const totalAppointments = appointments.filter((a) => a.status !== "Cancelada").length;
  const totalCancellations = appointments.filter((a) => a.status === "Cancelada").length;
  const totalNewClients = pipelineCards.filter((c) => c.stageId === "nuevo-lead").length;

  return (
    <div className="max-w-6xl space-y-6">
      <SectionTitle title="Analítica" subtitle="Cómo evoluciona tu negocio, en tiempo real" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Citas realizadas" value={String(totalAppointments)} />
        <StatTile label="Pacientes nuevos" value={String(totalNewClients)} />
        <StatTile label="Cancelaciones" value={String(totalCancellations)} deltaGood={false} />
        <StatTile label="Valoraciones recibidas" value={`${reviews.received} · ${reviews.avg}★`} />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-1">Citas realizadas</h2>
        <p className="text-xs text-ink-muted mb-4">Por día, todo el calendario</p>
        <LineChart data={appointmentsSeries} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Primeras visitas</h2>
          <p className="text-xs text-ink-muted mb-4">Nuevos pacientes captados por día</p>
          <LineChart data={newClientsSeries} color="#1baf7a" height={140} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Cancelaciones</h2>
          <p className="text-xs text-ink-muted mb-4">Por día, todo el calendario</p>
          <LineChart data={cancellationsSeries} color="#ec835a" height={140} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Canal de captación</h2>
          <p className="text-xs text-ink-muted mb-4">Pacientes por canal</p>
          <BarChart data={channelBreakdown.map((c) => ({ label: c.channel, value: c.value }))} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Ocupación semanal</h2>
          <p className="text-xs text-ink-muted mb-4">Citas por día de la semana</p>
          <BarChart data={weeklyOccupancy.map((d) => ({ label: d.day, value: d.value }))} color="#1baf7a" />
        </Card>
      </div>
    </div>
  );
}
