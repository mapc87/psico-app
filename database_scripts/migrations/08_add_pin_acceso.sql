-- Migración para añadir el PIN de acceso del portal del paciente
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS pin_acceso text;
