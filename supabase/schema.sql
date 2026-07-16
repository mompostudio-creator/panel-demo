-- MompoStudio OS · esquema inicial + datos de ejemplo (5 pacientes)
-- Ejecutar entero en Supabase: Dashboard -> SQL Editor -> New query -> pegar -> Run

create table if not exists patients (
  id text primary key,
  name text not null,
  phone text,
  email text,
  birth_date text,
  notes text default '',
  last_visit text,
  next_appointment text,
  status text not null default 'Nuevo',
  channel text,
  appointments jsonb not null default '[]',
  treatments jsonb not null default '[]',
  cancellations jsonb not null default '[]',
  reviews jsonb not null default '[]',
  timeline jsonb not null default '[]',
  medical_info jsonb not null default '{"allergies":"Por confirmar","conditions":"Por confirmar","medications":"Por confirmar"}',
  clinical_notes jsonb not null default '[]',
  documents jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id text primary key,
  time text not null,
  date text not null,
  client_id text references patients(id) on delete set null,
  client_name text not null,
  service text,
  status text not null default 'Confirmada',
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id text primary key,
  date text not null,
  client_id text references patients(id) on delete set null,
  client_name text not null,
  concept text,
  amount numeric not null default 0,
  status text not null default 'Pendiente',
  valid_until text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id text primary key,
  date text not null,
  client_id text references patients(id) on delete set null,
  client_name text not null,
  concept text,
  amount numeric not null default 0,
  method text not null default 'Efectivo',
  insurer text,
  status text not null default 'Pendiente',
  created_at timestamptz not null default now()
);

create table if not exists pipeline_cards (
  id text primary key,
  stage_id text not null,
  client_name text not null,
  client_id text references patients(id) on delete set null,
  detail text,
  updated text,
  reminders jsonb,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id bigint generated always as identity primary key,
  time text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists automations (
  name text primary key,
  status text not null default 'Activo',
  description text
);

-- Datos de ejemplo: 5 pacientes

insert into patients (id, name, phone, email, birth_date, notes, last_visit, next_appointment, status, channel, appointments, treatments, cancellations, reviews, timeline, medical_info, clinical_notes, documents) values
('c1', 'Carlos Martínez', '+34 611 223 344', 'carlos.martinez@example.com', '14 mar 1988', 'Prefiere citas por la mañana.', '6 jul 2026', '13 jul 2026 · 09:00', 'Activo', 'Instagram',
  '[{"date":"13 jul 2026","service":"Sesión de mantenimiento","status":"Confirmada"},{"date":"6 jul 2026","service":"Revisión general","status":"Completada"},{"date":"2 jun 2026","service":"Sesión de mantenimiento","status":"Completada"}]',
  '[{"date":"2 jun 2026","label":"Sesión completa"}]',
  '[]',
  '[{"date":"6 jul 2026","rating":5,"comment":"Muy buena atención, rápido y sin complicaciones."}]',
  '[{"date":"13 jul 2026 09:02","label":"Recordatorio de cita enviado"},{"date":"6 jul 2026 10:15","label":"Cita completada"},{"date":"2 jun 2026 09:40","label":"Valoración recibida (5★)"}]',
  '{"allergies":"Ninguna conocida","conditions":"Ninguna relevante","medications":"Ninguna"}',
  '[{"date":"6 jul 2026","author":"Pau Camps","note":"Buen estado general. Sin signos de sensibilidad."}]',
  '[{"name":"Informe revisión 6 jul 2026.pdf","date":"6 jul 2026","type":"Informe"}]'
),
('c2', 'María López', '+34 622 334 455', 'maria.lopez@example.com', '2 nov 1995', 'Programa de seguimiento en curso.', '30 jun 2026', '13 jul 2026 · 10:00', 'Activo', 'WhatsApp',
  '[{"date":"13 jul 2026","service":"Sesión de seguimiento","status":"Confirmada"},{"date":"30 jun 2026","service":"Ajuste de plan","status":"Completada"}]',
  '[{"date":"30 jun 2026","label":"Ajuste de plan"}]',
  '[{"date":"15 jun 2026","reason":"Imprevisto laboral"}]',
  '[]',
  '[{"date":"13 jul 2026 09:05","label":"Paciente confirmó asistencia"},{"date":"30 jun 2026 12:00","label":"Cita completada"},{"date":"15 jun 2026 08:30","label":"Cita cancelada"}]',
  '{"allergies":"Penicilina","conditions":"Programa de seguimiento en curso","medications":"Ninguna"}',
  '[{"date":"30 jun 2026","author":"Pau Camps","note":"Ajuste correcto, progresión según lo previsto."}]',
  '[{"name":"Radiografía panorámica.jpg","date":"30 jun 2026","type":"Radiografía"},{"name":"Plan de tratamiento.pdf","date":"1 abr 2026","type":"Plan"}]'
),
('c3', 'Juan Pérez', '+34 633 445 566', 'juan.perez@example.com', '21 ago 1979', 'Primera visita en el centro.', '—', '13 jul 2026 · 11:30', 'Nuevo', 'Formulario web',
  '[{"date":"13 jul 2026","service":"Primera visita","status":"Confirmada"}]',
  '[]', '[]', '[]',
  '[{"date":"11 jul 2026 18:22","label":"Nuevo paciente registrado"}]',
  '{"allergies":"Por confirmar","conditions":"Por confirmar (primera visita)","medications":"Por confirmar"}',
  '[]', '[]'
),
('c4', 'Ana Torres', '+34 644 556 677', 'ana.torres@example.com', '9 feb 1990', '', '20 may 2026', null, 'Inactivo', 'Instagram',
  '[{"date":"20 may 2026","service":"Revisión general","status":"Completada"}]',
  '[]', '[]',
  '[{"date":"20 may 2026","rating":4,"comment":"Todo bien, algo de espera."}]',
  '[{"date":"20 may 2026 17:10","label":"Cita completada"}]',
  '{"allergies":"Ninguna conocida","conditions":"Ninguna relevante","medications":"Ninguna"}',
  '[{"date":"20 may 2026","author":"Isabel Ferrer","note":"Revisión rutinaria sin hallazgos."}]',
  '[]'
),
('c5', 'Laura Sánchez', '+34 655 667 788', 'laura.sanchez@example.com', '30 dic 1992', 'Interesada en el programa premium.', '1 jul 2026', '18 jul 2026 · 16:00', 'Activo', 'Instagram',
  '[{"date":"18 jul 2026","service":"Programa premium","status":"Confirmada"},{"date":"1 jul 2026","service":"Revisión general","status":"Completada"}]',
  '[]', '[]', '[]',
  '[{"date":"1 jul 2026 11:00","label":"Valoración solicitada"}]',
  '{"allergies":"Ninguna conocida","conditions":"Ninguna relevante","medications":"Ninguna"}',
  '[{"date":"1 jul 2026","author":"Pau Camps","note":"Candidata a programa premium. Sin contraindicaciones."}]',
  '[]'
)
on conflict (id) do nothing;

-- Citas

insert into appointments (id, time, date, client_id, client_name, service, status) values
('a1', '09:00', '13 jul 2026', 'c1', 'Carlos Martínez', 'Sesión de mantenimiento', 'Confirmada'),
('a2', '10:00', '13 jul 2026', 'c2', 'María López', 'Sesión de seguimiento', 'Confirmada'),
('a3', '11:30', '13 jul 2026', 'c3', 'Juan Pérez', 'Primera visita', 'Confirmada'),
('a4', '12:30', '13 jul 2026', 'c5', 'Laura Sánchez', 'Evaluación programa premium', 'Confirmada'),
('a5', '17:00', '13 jul 2026', 'c4', 'Ana Torres', 'Revisión general', 'Confirmada'),
('a7', '11:00', '14 jul 2026', 'c2', 'María López', 'Ajuste de plan', 'Confirmada'),
('a8', '16:00', '18 jul 2026', 'c5', 'Laura Sánchez', 'Programa premium', 'Confirmada')
on conflict (id) do nothing;

-- Presupuestos

insert into quotes (id, date, client_id, client_name, concept, amount, status, valid_until) values
('q1', '11 jul 2026', 'c5', 'Laura Sánchez', 'Programa premium', 180, 'Pendiente', '25 jul 2026'),
('q2', '11 jul 2026', 'c3', 'Juan Pérez', 'Plan de tratamiento inicial', 320, 'Pendiente', '20 jul 2026'),
('q3', '28 jun 2026', 'c2', 'María López', 'Ajuste de ortodoncia completo', 450, 'Aprobado', '30 jun 2026'),
('q4', '20 jun 2026', 'c1', 'Carlos Martínez', 'Sesión de mantenimiento anual', 150, 'Aprobado', '5 jul 2026'),
('q5', '15 may 2026', 'c4', 'Ana Torres', 'Revisión + sesión de mantenimiento', 75, 'Rechazado', '29 may 2026')
on conflict (id) do nothing;

-- Facturas

insert into invoices (id, date, client_id, client_name, concept, amount, method, insurer, status) values
('f1', '13 jul 2026', 'c1', 'Carlos Martínez', 'Sesión de mantenimiento', 45, 'Tarjeta', null, 'Pagada'),
('f2', '13 jul 2026', 'c2', 'María López', 'Sesión de seguimiento', 60, 'Seguro', 'Sanitas', 'Pagada'),
('f3', '13 jul 2026', 'c3', 'Juan Pérez', 'Primera visita', 0, 'Efectivo', null, 'Pagada'),
('f4', '12 jul 2026', 'c5', 'Laura Sánchez', 'Revisión general', 30, 'Tarjeta', null, 'Pagada'),
('f5', '11 jul 2026', 'c4', 'Ana Torres', 'Revisión general', 30, 'Efectivo', null, 'Pendiente'),
('f6', '10 jul 2026', 'c2', 'María López', 'Ajuste de plan', 60, 'Seguro', 'Adeslas', 'Pagada'),
('f7', '6 jul 2026', 'c1', 'Carlos Martínez', 'Revisión general', 30, 'Tarjeta', null, 'Pagada'),
('f8', '1 jul 2026', 'c5', 'Laura Sánchez', 'Revisión general', 30, 'Financiado', null, 'Pendiente'),
('f9', '30 jun 2026', 'c2', 'María López', 'Ajuste de plan', 60, 'Seguro', 'Sanitas', 'Pagada'),
('f10', '20 may 2026', 'c4', 'Ana Torres', 'Revisión general', 30, 'Efectivo', null, 'Pagada')
on conflict (id) do nothing;

-- Pipeline

insert into pipeline_cards (id, stage_id, client_name, client_id, detail, updated, reminders) values
('pc4', 'cita-confirmada', 'Juan Pérez', 'c3', 'Primera visita · 13 jul 11:30', 'hace 1h', '{"h24":true,"h1":false}'),
('pc5', 'cita-confirmada', 'Ana Torres', 'c4', 'Revisión general · 13 jul 17:00', 'hace 1h', '{"h24":true,"h1":false}'),
('pc8', 'cita-confirmada', 'Laura Sánchez', 'c5', 'Programa premium · 18 jul 16:00', 'hace 1h', '{"h24":false,"h1":false}'),
('pc6', 'en-sesion', 'María López', 'c2', 'Sesión de seguimiento', 'desde hace 15 min', null),
('pc7', 'seguimiento', 'Carlos Martínez', 'c1', 'Valoración solicitada', 'hace 10 min', null)
on conflict (id) do nothing;

-- Historial de actividad

insert into activity_log (time, label) values
('09:02', 'Recordatorio enviado a Carlos Martínez'),
('09:05', 'María López confirmó asistencia'),
('10:15', 'Valoración solicitada a Laura Sánchez'),
('11:30', 'Ana Torres confirmó asistencia'),
('11:45', 'Nuevo paciente registrado: Juan Pérez');

-- Automatizaciones (solo lectura desde la app)

insert into automations (name, status, description) values
('WhatsApp IA', 'Activo', 'Responde consultas de pacientes 24/7'),
('Google Calendar', 'Sincronizado', 'Agenda sincronizada en tiempo real'),
('Recordatorios', 'Activo', 'Avisos 24h y 1h antes de cada cita'),
('Seguimientos', 'Activo', 'Contacto post-visita automático'),
('Valoraciones', 'Activo', 'Solicitud de reseña tras cada cita'),
('Reactivación', 'Activo', 'Contacto a pacientes inactivos'),
('IA Conversacional', 'Activo', 'Atiende consultas frecuentes del negocio')
on conflict (name) do nothing;
