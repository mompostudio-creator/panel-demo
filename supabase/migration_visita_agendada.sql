-- Renombra la etapa "Primera visita agendada" a "Visita agendada": agendar
-- una cita puede pasar muchas veces a lo largo de la relación con el
-- paciente, no solo la primera. Cualquier cita nueva reactiva la tarjeta a
-- "Visita agendada" venga de donde venga, salvo que ya esté en "Tratamiento
-- en curso" (una cita más ahí no es una señal de nada nuevo) o en "Aceptado"
-- (donde sí marca que el tratamiento arranca).

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
    values (new.client_id, new.client_name, 'visita-agendada', label, 'Ahora');
    return new;
  end if;

  if existing_stage = 'aceptado' then
    target_stage := 'tratamiento-en-curso';
  elsif existing_stage = 'tratamiento-en-curso' then
    target_stage := null;
  else
    target_stage := 'visita-agendada';
  end if;

  if target_stage is not null then
    update pipeline_cards set stage_id = target_stage, detail = label, updated = 'Ahora' where id = existing_id;
  end if;

  return new;
end;
$$ language plpgsql;

update pipeline_cards set stage_id = 'visita-agendada' where stage_id = 'primera-visita';
