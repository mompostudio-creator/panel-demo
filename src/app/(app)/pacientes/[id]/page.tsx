import { PatientDetail } from "@/components/PatientDetail";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <PatientDetail clientId={id} />;
}
