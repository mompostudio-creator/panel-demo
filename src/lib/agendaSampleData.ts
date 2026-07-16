import type { Appointment } from "@/lib/types";
import { formatSpanishDate } from "@/lib/dates";

// Citas de muestra solo para previsualizar cómo se ve la Agenda con las 5
// columnas de profesionales llenas. Viven únicamente en el cliente: nunca se
// guardan en Supabase ni aparecen en Citas, que solo lee reservas reales.
// El id empieza por "sample-" y el panel de detalle las trata como no
// editables por eso mismo.
//
// Fechadas siempre "hoy" (calculado en cada carga) para que quien entre a la
// demo, sea cuando sea, vea la agenda ya llena nada más abrir, sin tener que
// navegar a un día concreto.
export const AGENDA_SAMPLE_DATE = formatSpanishDate(new Date());

export const AGENDA_SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: "sample-1",
    date: AGENDA_SAMPLE_DATE,
    time: "09:30",
    clientId: "c3",
    clientName: "Juan Pérez",
    service: "Revisión ortodoncia",
    status: "Confirmada",
    professionalName: "Marta Ruiz",
    professionalRole: "Ortodoncia",
  },
  {
    id: "sample-2",
    date: AGENDA_SAMPLE_DATE,
    time: "11:00",
    clientId: "c2",
    clientName: "María López",
    service: "Ajuste brackets",
    status: "Confirmada",
    professionalName: "Marta Ruiz",
    professionalRole: "Ortodoncia",
  },
  {
    id: "sample-3",
    date: AGENDA_SAMPLE_DATE,
    time: "17:00",
    clientId: "c4",
    clientName: "Ana Torres",
    service: "Revisión alineadores",
    status: "Completada",
    professionalName: "Marta Ruiz",
    professionalRole: "Ortodoncia",
  },
  {
    id: "sample-4",
    date: AGENDA_SAMPLE_DATE,
    time: "10:00",
    clientId: "c1",
    clientName: "Carlos Martínez",
    service: "Implante unitario",
    status: "Confirmada",
    professionalName: "Álvaro Costa",
    professionalRole: "Implantología",
  },
  {
    id: "sample-5",
    date: AGENDA_SAMPLE_DATE,
    time: "12:00",
    clientId: "0717962f-7d03-4557-883d-56f7e8a40bae",
    clientName: "Carlos Mompo",
    service: "Revisión implante",
    status: "Confirmada",
    professionalName: "Álvaro Costa",
    professionalRole: "Implantología",
  },
  {
    id: "sample-6",
    date: AGENDA_SAMPLE_DATE,
    time: "18:00",
    clientId: "c3",
    clientName: "Juan Pérez",
    service: "Cirugía guiada",
    status: "Confirmada",
    professionalName: "Álvaro Costa",
    professionalRole: "Implantología",
  },
  {
    id: "sample-7",
    date: AGENDA_SAMPLE_DATE,
    time: "09:00",
    clientId: "c4",
    clientName: "Ana Torres",
    service: "Revisión infantil",
    status: "Confirmada",
    professionalName: "Nuria Sole",
    professionalRole: "Odontopediatría",
  },
  {
    id: "sample-8",
    date: AGENDA_SAMPLE_DATE,
    time: "16:30",
    clientId: "c5",
    clientName: "Laura Sánchez",
    service: "Limpieza + flúor",
    status: "Confirmada",
    professionalName: "Nuria Sole",
    professionalRole: "Odontopediatría",
  },
];
