-- Separa el nombre del paciente de la descripción de la acción,
-- para poder mostrar "Nombre" en negrita y la acción debajo en Actividades.

alter table activity_log add column if not exists actor_name text;

create or replace function log_activity(p_label text, p_event_type text, p_entity_type text, p_entity_id text, p_actor_name text default null) returns void as $$
begin
  insert into activity_log (time, label, event_type, entity_type, entity_id, actor_name)
  values ('Ahora', p_label, p_event_type, p_entity_type, p_entity_id, p_actor_name);
end;
$$ language plpgsql;

create or replace function log_activity_new_patient() returns trigger as $$
begin
  perform log_activity('Nuevo paciente registrado', 'nuevo_paciente', 'patient', new.id, new.name);
  return new;
end;
$$ language plpgsql;

create or replace function log_activity_appointment() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Cita creada · ' || format_appointment_label(new), 'cita_creada', 'appointment', new.id, new.client_name);
    return new;
  end if;

  if new.status = 'Cancelada' and old.status is distinct from 'Cancelada' then
    perform log_activity('Cita cancelada', 'cita_cancelada', 'appointment', new.id, new.client_name);
  elsif new.status = 'Completada' and old.status is distinct from 'Completada' then
    perform log_activity('Cita completada', 'cita_completada', 'appointment', new.id, new.client_name);
  elsif (new.date is distinct from old.date or new.time is distinct from old.time or new.starts_at is distinct from old.starts_at) then
    perform log_activity('Cita reagendada · ' || format_appointment_label(new), 'cita_reagendada', 'appointment', new.id, new.client_name);
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function log_activity_quote() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Presupuesto creado · ' || new.concept, 'presupuesto_creado', 'quote', new.id, new.client_name);
    return new;
  end if;

  if new.status = 'Aprobado' and old.status is distinct from 'Aprobado' then
    perform log_activity('Presupuesto aprobado · ' || new.concept, 'presupuesto_aprobado', 'quote', new.id, new.client_name);
  elsif new.status = 'Rechazado' and old.status is distinct from 'Rechazado' then
    perform log_activity('Presupuesto rechazado · ' || new.concept, 'presupuesto_rechazado', 'quote', new.id, new.client_name);
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function log_activity_invoice() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Factura registrada · ' || new.amount || '€', 'factura_creada', 'invoice', new.id, new.client_name);
    return new;
  end if;

  if new.status = 'Pagada' and old.status is distinct from 'Pagada' then
    perform log_activity('Factura cobrada · ' || new.amount || '€', 'factura_cobrada', 'invoice', new.id, new.client_name);
  end if;

  return new;
end;
$$ language plpgsql;
