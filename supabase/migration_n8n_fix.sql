-- Fix: permitir que las citas creadas por WhatsApp (que solo traen starts_at)
-- se guarden sin necesitar los campos de texto antiguos date/time.
alter table appointments alter column date drop not null;
alter table appointments alter column time drop not null;
