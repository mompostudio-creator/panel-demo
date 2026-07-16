-- Añade el marcador manual "¿ya se ha hecho el tratamiento?" a los presupuestos.
-- Solo tiene sentido una vez el presupuesto está Aprobado; lo marca la clínica
-- a mano en la ficha del paciente (no se puede deducir de forma fiable).

alter table quotes add column if not exists treatment_status text not null default 'Pendiente';
