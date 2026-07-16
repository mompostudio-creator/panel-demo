-- Actividades: registro automático de eventos, venga el cambio del panel o de WhatsApp.

alter table activity_log add column if not exists event_type text;
alter table activity_log add column if not exists entity_type text;
alter table activity_log add column if not exists entity_id text;

create or replace function log_activity(p_label text, p_event_type text, p_entity_type text, p_entity_id text) returns void as $$
begin
  insert into activity_log (time, label, event_type, entity_type, entity_id)
  values ('Ahora', p_label, p_event_type, p_entity_type, p_entity_id);
end;
$$ language plpgsql;

-- Paciente nuevo
create or replace function log_activity_new_patient() returns trigger as $$
begin
  perform log_activity('Nuevo paciente registrado: ' || new.name, 'nuevo_paciente', 'patient', new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_new_patient on patients;
create trigger trg_log_new_patient
after insert on patients
for each row execute function log_activity_new_patient();

-- Citas: creada / cancelada / reagendada / completada
create or replace function log_activity_appointment() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Nueva cita: ' || new.client_name || ' el ' || format_appointment_label(new), 'cita_creada', 'appointment', new.id);
    return new;
  end if;

  if new.status = 'Cancelada' and old.status is distinct from 'Cancelada' then
    perform log_activity('Cita cancelada: ' || new.client_name, 'cita_cancelada', 'appointment', new.id);
  elsif new.status = 'Completada' and old.status is distinct from 'Completada' then
    perform log_activity('Cita completada: ' || new.client_name, 'cita_completada', 'appointment', new.id);
  elsif (new.date is distinct from old.date or new.time is distinct from old.time or new.starts_at is distinct from old.starts_at) then
    perform log_activity('Cita reagendada: ' || new.client_name || ' → ' || format_appointment_label(new), 'cita_reagendada', 'appointment', new.id);
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_appointment on appointments;
create trigger trg_log_appointment
after insert or update on appointments
for each row execute function log_activity_appointment();

-- Presupuestos: creado / aprobado / rechazado
create or replace function log_activity_quote() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Presupuesto creado: ' || new.concept || ' (' || new.client_name || ')', 'presupuesto_creado', 'quote', new.id);
    return new;
  end if;

  if new.status = 'Aprobado' and old.status is distinct from 'Aprobado' then
    perform log_activity('Presupuesto aprobado: ' || new.concept || ' (' || new.client_name || ')', 'presupuesto_aprobado', 'quote', new.id);
  elsif new.status = 'Rechazado' and old.status is distinct from 'Rechazado' then
    perform log_activity('Presupuesto rechazado: ' || new.concept || ' (' || new.client_name || ')', 'presupuesto_rechazado', 'quote', new.id);
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_quote on quotes;
create trigger trg_log_quote
after insert or update on quotes
for each row execute function log_activity_quote();

-- Facturas: creada / cobrada
create or replace function log_activity_invoice() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform log_activity('Factura registrada: ' || new.client_name || ' · ' || new.amount || '€', 'factura_creada', 'invoice', new.id);
    return new;
  end if;

  if new.status = 'Pagada' and old.status is distinct from 'Pagada' then
    perform log_activity('Factura cobrada: ' || new.client_name || ' · ' || new.amount || '€', 'factura_cobrada', 'invoice', new.id);
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_invoice on invoices;
create trigger trg_log_invoice
after insert or update on invoices
for each row execute function log_activity_invoice();
