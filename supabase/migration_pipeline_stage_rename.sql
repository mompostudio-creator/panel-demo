-- Actualiza los triggers de Pipeline a la nueva taxonomía de 9 etapas
-- (nuevo-lead, primera-visita, diagnostico, presupuesto-enviado, en-seguimiento,
-- aceptado, tratamiento-en-curso, finalizado, perdido). Sustituye a las
-- versiones antiguas definidas en migration_pipeline_triggers.sql.

-- 1. Paciente nuevo -> tarjeta en "Nuevo lead"
create or replace function sync_pipeline_new_patient() returns trigger as $$
begin
  insert into pipeline_cards (client_id, client_name, stage_id, detail, updated)
  values (new.id, new.name, 'nuevo-lead', 'Nuevo paciente registrado', 'Ahora');
  return new;
end;
$$ language plpgsql;

-- 2. Cita confirmada/modificada -> "Primera visita agendada" (o "Tratamiento en
--    curso" si el presupuesto ya estaba Aceptado). Nunca hace retroceder una
--    tarjeta que ya avanzó más allá de esas dos etapas.
create or replace function sync_pipeline_appointment() returns trigger as $$
declare
  existing_id text;
  existing_stage text;
  label text;
  target_stage text;
begin
  if new.client_id is null or new.status not in ('Confirmada', 'Modificada') then
    return new;
  end if;

  label := coalesce(new.service, '') || ' · ' || format_appointment_label(new);

  select id, stage_id into existing_id, existing_stage from pipeline_cards where client_id = new.client_id limit 1;

  if existing_id is null then
    insert into pipeline_cards (client_id, client_name, stage_id, detail, updated)
    values (new.client_id, new.client_name, 'primera-visita', label, 'Ahora');
    return new;
  end if;

  if existing_stage = 'aceptado' then
    target_stage := 'tratamiento-en-curso';
  elsif existing_stage in ('nuevo-lead', 'primera-visita') then
    target_stage := 'primera-visita';
  else
    target_stage := null;
  end if;

  if target_stage is not null then
    update pipeline_cards set stage_id = target_stage, detail = label, updated = 'Ahora' where id = existing_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- 3. Paciente marcado Inactivo -> "Perdido"
create or replace function sync_pipeline_patient_inactive() returns trigger as $$
begin
  if new.status = 'Inactivo' and old.status is distinct from 'Inactivo' then
    update pipeline_cards set stage_id = 'perdido', updated = 'Ahora' where client_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Los triggers ya apuntan a estas funciones (se redefinen con CREATE OR REPLACE
-- arriba), así que no hace falta recrearlos. Por si alguno faltara:
drop trigger if exists trg_pipeline_new_patient on patients;
create trigger trg_pipeline_new_patient
after insert on patients
for each row execute function sync_pipeline_new_patient();

drop trigger if exists trg_pipeline_appointment on appointments;
create trigger trg_pipeline_appointment
after insert or update on appointments
for each row execute function sync_pipeline_appointment();

drop trigger if exists trg_pipeline_patient_inactive on patients;
create trigger trg_pipeline_patient_inactive
after update on patients
for each row execute function sync_pipeline_patient_inactive();

-- Por si quedara alguna tarjeta con un id de etapa antiguo (de antes de este cambio).
update pipeline_cards set stage_id = 'nuevo-lead' where stage_id in ('nuevo-contacto', 'conversacion-iniciada');
update pipeline_cards set stage_id = 'primera-visita' where stage_id = 'cita-confirmada';
update pipeline_cards set stage_id = 'tratamiento-en-curso' where stage_id = 'en-sesion';
update pipeline_cards set stage_id = 'en-seguimiento' where stage_id = 'seguimiento';
update pipeline_cards set stage_id = 'perdido' where stage_id = 'reactivacion';
