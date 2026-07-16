import { AppShell } from "@/components/AppShell";
import { logout } from "../login/actions";
import {
  COMPANY_NAME,
  getClients,
  getQuotes,
  getInvoices,
  getAllAppointments,
  getPipelineCards,
  getHistoryActivities,
  getAutomationsView,
} from "@/lib/data";
import { AppDataProvider } from "@/lib/store";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [clients, quotes, invoices, appointments, pipelineCards, activityLog, automations] = await Promise.all([
    getClients(),
    getQuotes(),
    getInvoices(),
    getAllAppointments(),
    getPipelineCards(),
    getHistoryActivities(),
    getAutomationsView(),
  ]);

  return (
    <AppDataProvider
      initialClients={clients}
      initialQuotes={quotes}
      initialInvoices={invoices}
      initialAppointments={appointments}
      initialPipelineCards={pipelineCards}
      initialActivityLog={activityLog}
      initialAutomations={automations}
    >
      <AppShell companyName={COMPANY_NAME} onLogout={logout}>
        {children}
      </AppShell>
    </AppDataProvider>
  );
}
