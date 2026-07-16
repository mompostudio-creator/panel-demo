import { parseSpanishDate } from "@/lib/dates";
import type { Appointment, Client } from "@/lib/data";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function computeAppointmentSeries(appointments: Appointment[]) {
  const byDate = new Map<string, { date: string; confirmadas: number; canceladas: number; primeraVisita: number }>();
  for (const a of appointments) {
    if (!byDate.has(a.date)) byDate.set(a.date, { date: a.date, confirmadas: 0, canceladas: 0, primeraVisita: 0 });
    const bucket = byDate.get(a.date)!;
    if (a.status === "Cancelada") bucket.canceladas += 1;
    else bucket.confirmadas += 1;
    if (a.service === "Primera visita") bucket.primeraVisita += 1;
  }
  const sorted = Array.from(byDate.values()).sort(
    (a, b) => parseSpanishDate(a.date).getTime() - parseSpanishDate(b.date).getTime()
  );
  return {
    appointmentsSeries: sorted.map((d) => ({ date: d.date, value: d.confirmadas })),
    cancellationsSeries: sorted.map((d) => ({ date: d.date, value: d.canceladas })),
    newClientsSeries: sorted.map((d) => ({ date: d.date, value: d.primeraVisita })),
  };
}

export function computeChannelBreakdown(clients: Client[]) {
  const counts = new Map<string, number>();
  for (const c of clients) counts.set(c.channel, (counts.get(c.channel) ?? 0) + 1);
  return Array.from(counts.entries()).map(([channel, value]) => ({ channel, value }));
}

export function computeWeeklyOccupancy(appointments: Appointment[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const a of appointments) {
    if (a.status === "Cancelada") continue;
    counts[parseSpanishDate(a.date).getDay()] += 1;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((day) => ({ day: WEEKDAY_LABELS[day], value: counts[day] }));
}

export function computeReviews(clients: Client[]) {
  const all = clients.flatMap((c) => c.reviews);
  const received = all.length;
  const avg = received === 0 ? 0 : Math.round((all.reduce((s, r) => s + r.rating, 0) / received) * 10) / 10;
  return { received, avg };
}
