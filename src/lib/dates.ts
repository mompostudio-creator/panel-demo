export const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MONTHS_LONG_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
// Cabecera de semana empezando en lunes (para grids que usan startOfWeek/getMonthGridDays)
export const DAYS_ES_MON_FIRST = [DAYS_ES[1], DAYS_ES[2], DAYS_ES[3], DAYS_ES[4], DAYS_ES[5], DAYS_ES[6], DAYS_ES[0]];

export function parseSpanishDate(dateStr: string): Date {
  const [day, mon, year] = dateStr.split(" ");
  const monthIndex = MONTHS_ES.indexOf((mon ?? "").toLowerCase());
  if (monthIndex === -1 || !year) {
    throw new Error(`Fecha con formato inválido: "${dateStr}" (se esperaba "13 jul 2026")`);
  }
  return new Date(Number(year), monthIndex, Number(day));
}

export function formatSpanishDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRelativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const diffSeconds = Math.round((Date.now() - then) / 1000);

  if (diffSeconds < 30) return "ahora mismo";
  if (diffSeconds < 60) return `hace ${diffSeconds} s`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;

  const then_ = new Date(isoString);
  return formatSpanishDate(then_);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function appointmentDateTime(item: { date: string; time: string }): Date {
  const d = parseSpanishDate(item.date);
  const [h, m] = item.time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function sortByDateTime<T extends { date: string; time: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => appointmentDateTime(a).getTime() - appointmentDateTime(b).getTime());
}

export function isOnOrAfterDay(item: { date: string }, reference: Date): boolean {
  const d = parseSpanishDate(item.date);
  const ref = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return d.getTime() >= ref.getTime();
}

export function groupByDate<T extends { date: string; time: string }>(items: T[]): { date: string; items: T[] }[] {
  const sorted = sortByDateTime(items);
  const map = new Map<string, T[]>();
  for (const item of sorted) {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date)!.push(item);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthGridDays(date: Date): Date[] {
  const firstOfMonth = startOfMonth(date);
  const gridStart = startOfWeek(firstOfMonth);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}
