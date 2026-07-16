-- Mantiene patients.next_appointment sincronizado automáticamente,
-- sin importar si la cita se crea desde el panel o desde el agente de WhatsApp.

create or replace function format_appointment_label(a appointments) returns text as $$
declare
  months text[] := array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  local_ts timestamp;
begin
  if a.starts_at is not null then
    local_ts := a.starts_at at time zone 'Europe/Madrid';
    return extract(day from local_ts)::int || ' ' || months[extract(month from local_ts)::int] || ' ' || extract(year from local_ts)::int || ' · ' || to_char(local_ts, 'HH24:MI');
  else
    return a.date || ' · ' || a.time;
  end if;
end;
$$ language plpgsql immutable;

create or replace function sync_patient_next_appointment() returns trigger as $$
declare
  target_client_id text := coalesce(new.client_id, old.client_id);
begin
  if target_client_id is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' or new.status in ('Cancelada', 'Completada') then
    update patients set next_appointment = null where id = target_client_id;
  else
    update patients set next_appointment = format_appointment_label(new) where id = target_client_id;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_sync_next_appointment on appointments;
create trigger trg_sync_next_appointment
after insert or update or delete on appointments
for each row execute function sync_patient_next_appointment();
