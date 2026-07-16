-- Añade el profesional asignado a cada cita (equipo fijo de la clínica:
-- Pau Camps / Isabel Ferrer, ya usados como autores en notas clínicas).

alter table appointments add column if not exists professional_name text not null default 'Pau Camps';
alter table appointments add column if not exists professional_role text not null default 'Odontología general';
