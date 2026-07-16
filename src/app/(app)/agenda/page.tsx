import { SectionTitle } from "@/components/ui";
import { Calendar } from "@/components/Calendar";
import { toISODate } from "@/lib/dates";

export default function AgendaPage() {
  return (
    <div>
      <SectionTitle title="Agenda" subtitle="Vista de calendario por día, semana o mes" />
      <Calendar initialDate={toISODate(new Date())} />
    </div>
  );
}
