-- Si se cancela una cita y al paciente no le queda ninguna otra pendiente
-- (Confirmada/Modificada), y su tarjeta solo estaba en el Pipeline por tener
-- una visita agendada, se elimina la tarjeta: no tiene sentido dejarla como
-- "Nuevo lead" (ya no es un contacto nuevo). Una cita futura la recreará.

create or replace function sync_pipeline_appointment_cancelled() returns trigger as $$
declare
  existing_stage text;
  other_pending int;
begin
  if new.status <> 'Cancelada' or new.client_id is null then
    return new;
  end if;

  select stage_id into existing_stage from pipeline_cards where client_id = new.client_id limit 1;
  if existing_stage is distinct from 'visita-agendada' then
    return new;
  end if;

  select count(*) into other_pending
  from appointments
  where client_id = new.client_id
    and id <> new.id
    and status in ('Confirmada', 'Modificada');

  if other_pending = 0 then
    delete from pipeline_cards where client_id = new.client_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pipeline_appointment_cancelled on appointments;
create trigger trg_pipeline_appointment_cancelled
after update on appointments
for each row execute function sync_pipeline_appointment_cancelled();
