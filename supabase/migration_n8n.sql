-- Migración para conectar n8n (agente de WhatsApp) a Supabase en vez de Airtable
-- Ejecutar entero en Supabase: Dashboard -> SQL Editor -> pegar -> Run

-- IDs autogenerados: para que n8n pueda insertar filas sin tener que inventar un id único
alter table patients alter column id set default gen_random_uuid()::text;
alter table appointments alter column id set default gen_random_uuid()::text;
alter table quotes alter column id set default gen_random_uuid()::text;
alter table invoices alter column id set default gen_random_uuid()::text;
alter table pipeline_cards alter column id set default gen_random_uuid()::text;

-- Búsqueda de paciente por teléfono, sin importar el formato (+34, espacios, etc.)
alter table patients add column if not exists phone_normalized text
  generated always as (regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')) stored;
create index if not exists idx_patients_phone_normalized on patients(phone_normalized);

-- Datos que necesitan las automatizaciones de citas (crear / cancelar / modificar / actualizar estado)
alter table appointments add column if not exists notes text;
alter table appointments add column if not exists event_id_google text;
alter table appointments add column if not exists starts_at timestamptz;
create index if not exists idx_appointments_event_id_google on appointments(event_id_google);

-- Vista para que n8n pueda buscar citas de un paciente directamente por su teléfono
create or replace view appointments_with_patient as
select a.*, p.phone, p.phone_normalized, p.name as patient_name_lookup
from appointments a
left join patients p on p.id = a.client_id;
